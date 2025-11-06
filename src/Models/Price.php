<?php

namespace App\Models;

use App\Database\Connection;

class Price {
    public $id;
    public $product_id;
    public $amount;
    public $currency_id;

    public function __construct($id = null, $product_id = null, $amount = null, $currency_id = null) {
        $this->id = $id;
        $this->product_id = $product_id;
        $this->amount = $amount;
        $this->currency_id = $currency_id;
    }

    public static function getAll(): array {
            $db = (new Connection())->connect();
            $result = $db->query("SELECT id, product_id, amount, currency_id FROM prices");

            $currencies = [];
            while ($row = $result->fetch_assoc()) {
                $currencies[] = new self($row['id'], $row['product_id'], $row['amount'], $row['currency_id']);
            }
           
            $db->close();
            return $currencies;
        }

    public static function getByProductId(string $productId): array {
        $db = (new Connection())->connect();
        $stmt = $db->prepare("SELECT id, product_id, amount, currency_id FROM prices WHERE product_id = ?");
        $stmt->bind_param("s", $productId);
        $stmt->execute();
        $result = $stmt->get_result();

        $prices = [];
        while ($row = $result->fetch_assoc()) {
            $prices[] = new self($row['id'], $row['product_id'], $row['amount'], $row['currency_id']);
        }

        $stmt->close();
        $db->close();
        return $prices;
    }
}
?>