<?php

namespace App\Models;

use App\Database\Connection;

class Category {
    private int $id;
    private string $name;
    public static function getAll(): array
    {
        $db = new Connection();
        $conn = $db->connect();
        $res = $conn->query("SELECT id, name FROM categories");
        return $res->fetch_all(MYSQLI_ASSOC); // each row will be represented as an associative array with keys
    }
}