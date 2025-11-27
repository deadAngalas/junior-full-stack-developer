<?php

namespace App\Models;

use App\Database\Connection;

class Currency extends Price
{
    private string $label;
    private string $symbol;

    private static array $cache = [];

    public function __construct(int $id, string $label, string $symbol)
    {
        parent::__construct($id, '', 0.0, $id);
        $this->label = $label;
        $this->symbol = $symbol;
    }

    public function getLabel(): string
    {
        return $this->label;
    }
    public function getSymbol(): string
    {
        return $this->symbol;
    }

    public static function getById(int $id): ?self
    {
        if ($id <= 0) return null;

        if (isset(self::$cache[$id])) {
            return self::$cache[$id];
        }

        $db = (new Connection())->connect();
        $stmt = $db->prepare("SELECT id, label, symbol FROM currencies WHERE id = ?");
        $stmt->bind_param("i", $id);
        $stmt->execute();
        $row = $stmt->get_result()->fetch_assoc();
        $stmt->close();
        $db->close();

        if (!$row) {
            self::$cache[$id] = null;
            return null;
        }

        $c = new self((int)$row['id'], $row['label'], $row['symbol']);
        self::$cache[$id] = $c;
        return $c;
    }
}
