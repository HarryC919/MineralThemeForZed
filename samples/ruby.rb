# frozen_string_literal: true

# Ruby sample: modules, metaprogramming, blocks, regex, heredoc
require 'json'
require_relative 'helper'

module DarkTheme
  VERSION = '0.5.3'
  DEFAULT_COLOR = :teal
  RATIO = 1.618

  class ThemeError < StandardError
    attr_reader :code

    def initialize(message, code: 0xFF)
      super(message)
      @code = code
    end
  end

  module Colors
    VALID = %i[teal blue pink orange].freeze
    HEX = { teal: '#80CBC4', blue: '#5393FF', pink: '#FF669E' }.freeze

    def self.valid?(name)
      VALID.include?(name.to_sym)
    end

    def hex(name)
      HEX.fetch(name.to_sym) { raise ThemeError, "unknown color: #{name}" }
    end
  end

  class Theme
    include Comparable
    extend Colors

    attr_accessor :name, :background
    attr_reader :variants

    def initialize(name:, background: '#0A0A0A', variants: [])
      @name = name
      @background = background
      @variants = variants
      @created_at = Time.now
    end

    def <=>(other)
      name <=> other.name
    end

    def each_variant(&block)
      return to_enum(:each_variant) unless block_given?

      variants.each(&block)
      self
    end

    def self.parse(json_string)
      data = JSON.parse(json_string, symbolize_names: true)
      new(name: data[:name], background: data[:background])
    rescue JSON::ParserError => e
      raise ThemeError.new("invalid json: #{e.message}", code: 0x10)
    end

    def to_s
      format('%s@%s', name, background)
    end
  end
end

theme = DarkTheme::Theme.new(
  name: "My Dark Theme #{:carbon.to_s.capitalize}",
  variants: %w[teal carbon ocean],
)

pattern = /^(?<variant>[a-z]+)-?(?<hc>high[-_ ]contrast)?$/i
%w[carbon carbon-high-contrast Teal].each do |raw|
  match = pattern.match(raw)
  next unless match

  variant = match[:variant].downcase
  is_hc = !match[:hc].nil?
  puts format('%-8s hc=%s hex=%s', variant, is_hc, DarkTheme::Theme.hex(variant))
rescue DarkTheme::ThemeError => e
  warn "error #{'0x%02X' % e.code}: #{e.message}"
ensure
  puts "-- checked #{raw}"
end

sum = [1, 2, 3].sum { |n| n**2 }
mapped = (1..10).step(2).map { it * 2 }.select(&:even?)
squashed = mapped.each_with_object([]) { |v, acc| acc << v unless acc.include?(v) }

heredoc = <<~SQL
  SELECT *
  FROM themes
  WHERE name LIKE '%dark%'
SQL

plain_heredoc = <<-TEXT
  indented \#{not interpolated} #{theme.name}
TEXT

puts <<~HEREDOC
  sum=#{sum} mapped=#{mapped.inspect} squashed=#{squashed}
  lambda: #{->(x) { x * RATIO }.call(2)}
  proc: #{proc { |a, b| a + b }.call(1, 2)}
  ternary: #{theme.variants.empty? ? 'empty' : 'filled'}
HEREDOC

begin
  theme.each_variant.with_index(1) do |variant, index|
    puts "#{index}: #{variant.to_sym}"
    break if index >= 3
  end
rescue StandardError, NotImplementedError => e
  warn e.full_message(highlight: false)
end
