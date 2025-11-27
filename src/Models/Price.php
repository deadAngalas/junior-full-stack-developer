<?php

namespace App\Models;

class Price
{
    private int $id;
    private string $product_id;
    private float $amount;
    private int $currency_id;

    public function __construct(int $id, string $product_id, float $amount, int $currency_id)
    {
        $this->id = $id;
        $this->product_id = $product_id;
        $this->amount = $amount;
        $this->currency_id = $currency_id;
    }

    public function getId(): int
    {
        return $this->id;
    }
    public function getProductId(): string
    {
        return $this->product_id;
    }
    public function getAmount(): float
    {
        return $this->amount;
    }
    public function getCurrencyId(): int
    {
        return $this->currency_id;
    }

    public function getCurrency(): ?Currency {
        return Currency::getById($this->currency_id ?? null);
    }
}
