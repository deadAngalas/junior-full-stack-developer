<?php

namespace App\Models;

use App\Database\Connection;

class AttributeSet {
    public $id;
    public $name;
    public $type;
    public array $attributes = [];

    public function __construct($id = null, $name = null, $type = null) {
        $this->id = $id;
        $this->name = $name;
        $this->type = $type;
    }

    public static function getAll(): array {
        $db = (new Connection())->connect();
        $result = $db->query("SELECT id, name, type FROM attribute_sets");
        $sets = [];

        while ($row = $result->fetch_assoc()) {
            $sets[] = new self($row['id'], $row['name'], $row['type']);
        }

        $db->close();
        return $sets;
    }

    public function getAttributes(string $productId): array {
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
        $attributes = [];
        $seen = [];

        while ($row = $result->fetch_assoc()) {
            error_log(print_r($row, true));
            $attributes[] = [
                'id' => (int)$row['id'],
                'value' => $row['value'],
                'displayValue' => $row['display_value'] ?? $row['value']
            ];
        }

        $stmt->close();
        $db->close();

        return $attributes;
    }

}
?>
