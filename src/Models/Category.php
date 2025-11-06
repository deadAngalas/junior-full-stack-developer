<?php

namespace App\Models;

use App\Database\Connection;

class Category {
    public $id;
    public $name;

    public function __construct($id = null, $name = null) {
        $this->id = $id;
        $this->name = $name;
    }

    public static function getAll(): array {
        $db = (new Connection())->connect();
        $result = $db->query("SELECT id, name FROM categories");
        $categories = [];

        while ($row = $result->fetch_assoc()) {
            $categories[] = new self($row['id'], $row['name']);
        }

        $db->close();
        return $categories;
    }
}
?>