<?php

declare(strict_types=1);

namespace DarkTheme\Samples;

use DarkTheme\Contracts\Renderable;
use DarkTheme\Exceptions\ThemeException;
use function DarkTheme\Helpers\{slugify, hexToRgb};
use const DarkTheme\DEFAULT_ACCENT;

#[Attribute(Attribute::TARGET_CLASS)]
final readonly class Sample
{
    public function __construct(
        public string $description,
        public ?string $group = null,
        public int $priority = 0x10,
    ) {
    }
}

enum Status: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Pending = 'pending';

    public function label(): string
    {
        return match ($this) {
            Status::Active => 'Active now',
            Status::Inactive, Status::Pending => "Not active: {$this->value}",
        };
    }
}

#[Sample(description: 'theme renderer', group: 'render', priority: 0xFF)]
abstract class Renderer implements Renderable, \Countable
{
    protected const VERSION = '1.0.0';
    private static int $instances = 0;
    public string $name {
        get => ucfirst($this->name);
    }

    public function __construct(
        protected string $name,
        protected array $variants = [],
    ) {
        self::$instances++;
    }

    abstract public function render(bool $highContrast = false): string;

    public static function instances(): int
    {
        return static::$instances;
    }

    public function count(): int
    {
        return count($this->variants);
    }

    public function __toString(): string
    {
        return sprintf('%s v%s (%d)', $this->name, self::VERSION, $this->count());
    }
}

final class ThemeRenderer extends Renderer
{
    private const MASK = 0b1010_1010;

    public function render(bool $highContrast = false): string
    {
        $colors = [
            'accent' => DEFAULT_ACCENT,
            'background' => '#0A0A0A',
            'variants' => array_map(
                static fn (array $variant): string => slugify($variant['name'] ?? 'none'),
                $this->variants,
            ),
        ];

        $hex = $colors['accent'];
        [$r, $g, $b] = hexToRgb($hex) ?? [0, 0, 0];
        $brightness = ($r * 0x1F + $g << 2) ^ self::MASK;

        foreach ($colors['variants'] as $index => $variant) {
            yield "variant-{$index}" => strtoupper($variant);
        }

        try {
            if ($brightness < 0 && $highContrast) {
                throw new ThemeException('contrast too low');
            }
            $label = Status::from('active')->label();
        } catch (ThemeException | ValueError $e) {
            error_log("[{$e->getCode()}] {$e->getMessage()}");
            $label = Status::tryFrom('missing')?->label() ?? 'unknown';
        } finally {
            $brightness = max(0, $brightness);
        }

        $template = <<<HTML
            <theme name="{$this->name}" accent="{$hex}">
              <variant hc="{$highContrast ? 'true' : 'false'}" brightness="{$brightness}"/>
            </theme>
            HTML;

        return $template . $label . "instances=" . self::instances();
    }
}

$renderer = new ThemeRenderer('Mineral Theme', [
    ['name' => 'Carbon'],
    ['name' => 'Teal'],
    ['name' => 'Ocean'],
]);

echo $renderer, PHP_EOL, $renderer->render(highContrast: true);
