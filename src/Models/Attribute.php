<?php

namespace App\Models;

class Attribute
{
    private int $id;
    private string $displayValue;
    private string $value;

    public function __construct(int $id, string $product_id, string $image_url)
    {
        $this->id = $id;
        $this->product_id = $product_id;
        $this->image_url = $image_url;
    }
    public function getId(): int
    {
        return $this->id;
    }
    public function getDisplayValue(): string
    {
        return $this->displayValue;
    }
    public function getValue(): string
    {
        return $this->value;
    }
}