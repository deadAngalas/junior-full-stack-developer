<?php

namespace App\Models;

use App\Database\Connection;

class AttributeSet
{
    private int $id;
    private string $name;
    private string $type;
    private array $attributes = [];

    public function __construct(int $id, string $name, string $type)
    {
        $this->id = $id;
        $this->name = $name;
        $this->type = $type;
    }

    public function getId(): int
    {
        return $this->id;
    }
    public function getName(): string
    {
        return $this->name;
    }
    public function getType(): string
    {
        return $this->type;
    }
    public function getAttributes(): array
    {
        return $this->attributes;
    }

    public function setAttributes(array $attributes): void
    {
        $this->attributes = $attributes;
    }

    public function loadAttributesByProductId(string $productId): void
    {
        $db = (new Connection())->connect();

        $stmt = $db->prepare("
            SELECT DISTINCT a.id, a.value, a.display_value
            FROM attributes a
            JOIN product_attributes pa ON pa.attribute_id = a.id
            WHERE pa.product_id = ? AND a.attribute_set_id = ?
            ORDER BY a.id
        ");
        $stmt->bind_param("si", $productId, $this->id);
        $stmt->execute();

        $result = $stmt->get_result();
        $attrs = [];

        while ($row = $result->fetch_assoc()) {
            $attrs[] = [
                'id' => (int) $row['id'],
                'value' => $row['value'],
                'displayValue' => $row['display_value'] ?? $row['value']
            ];
        }

        $stmt->close();
        $db->close();
        $this->setAttributes($attrs);
    }

}
