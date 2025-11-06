<?php

namespace App\Models;

use App\Database\Connection;

class Currency {
    public $id;
    public $label;
    public $symbol;

    public static function getAll(): array {
            $db = (new Connection())->connect();
            $result = $db->query("SELECT id, label, symbol FROM currencies");
            $currencies = [];

            while ($row = $result->fetch_assoc()) {
                $c = new self();
                $c->id = $row['id'];
                $c->label = $row['label'];
                $c->symbol = $row['symbol'];
                $currencies[] = $c;
            }

            $db->close();
            return $currencies;
        }
}
?>