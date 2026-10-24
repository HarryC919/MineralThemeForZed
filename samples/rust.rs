//! Crate-level doc comment: if for match impl trait
use std::collections::HashMap;
use std::fmt::{self, Display, Formatter};

pub mod network {
    pub mod tcp {
        pub const DEFAULT_PORT: u16 = 0x1F90;
        pub fn connect(addr: &str) -> Result<(), std::io::Error> {
            Ok(())
        }
    }
}

/// Doc comment for a struct with generics and lifetime
#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct Endpoint<'a> {
    pub host: &'a str,
    pub port: u16,
    metadata: HashMap<String, Vec<u8>>,
}

#[derive(Debug, Default)]
pub enum Protocol {
    #[default]
    Http,
    Https,
    WebSocket { version: u8 },
    Custom(String),
}

impl<'a> Endpoint<'a> {
    /// Construct a new endpoint.
    ///
    /// # Errors
    /// Returns an error when the port is privileged.
    pub fn new(host: &'a str, port: u16) -> Result<Self, String> {
        if port < 1024 && port != 0 {
            return Err(format!("privileged port: {port}"));
        }
        Ok(Self {
            host,
            port,
            metadata: HashMap::new(),
        })
    }

    pub fn is_secure(&self) -> bool {
        matches!(self.port, 443 | 8443) || self.host.starts_with("https")
    }
}

impl Display for Endpoint<'_> {
    fn fmt(&self, f: &mut Formatter<'_>) -> fmt::Result {
        write!(f, "{}:{}", self.host, self.port)
    }
}

pub trait Transport {
    type Error;
    fn send(&mut self, payload: &[u8]) -> Result<usize, Self::Error>;
}

struct UdpTransport {
    retries: u32,
    timeout_ms: f64,
}

impl Transport for UdpTransport {
    type Error = String;

    fn send(&mut self, payload: &[u8]) -> Result<usize, Self::Error> {
        let mut sent = 0usize;
        for (i, byte) in payload.iter().enumerate() {
            if byte == &0xFF {
                continue;
            }
            sent += 1;
            self.retries = self.retries.saturating_add(i as u32);
        }
        Ok(sent)
    }
}

async fn dispatch<T: Transport + ?Sized>(transport: &mut T, raw: &str) -> Result<(), T::Error> {
    let payload = raw.as_bytes();
    let n = transport.send(payload).await?;
    println!("sent {n} bytes of {raw:?}");
    Ok(())
}

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut endpoint = Endpoint::new("localhost", 8080)?;
    let protocol = Protocol::WebSocket { version: 13 };
    let raw_input = r"a raw \string with \n escapes";
    let bytes = b"\x00\x01\x02";

    match protocol {
        Protocol::Http => println!("http on {}", endpoint),
        Protocol::Https if endpoint.is_secure() => println!("secure!"),
        Protocol::WebSocket { version } => {
            let upgraded = version >= 13;
            println!("ws v{version}, upgraded: {upgraded}");
        }
        Protocol::Custom(name) => println!("custom: {name}"),
    }

    let closure = |x: i32, y: i32| -> i32 { x.wrapping_mul(2) + y };
    let computed = closure(0b1010, 0o777) as f32 / 3.141_592_65_f32;
    let mut transport = UdpTransport { retries: 3, timeout_ms: 2.5e3 };
    transport.send(bytes)?;

    network::tcp::connect("127.0.0.1")?;
    endpoint.metadata.insert("id".into(), vec![1, 2, 3]);
    let _ = dispatch(&mut transport, raw_input).await;
    Ok(())
}
