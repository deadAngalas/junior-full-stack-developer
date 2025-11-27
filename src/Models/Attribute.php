<?php

namespace App\Models;

class Attribute extends AttributeSet
{
    private int $attributeId;
    private string $displayValue;
    private string $value;

    public function __construct(
        int $setId,
        string $setName,
        string $setType,
        int $attributeId,
        string $value,
        string $displayValue = ''
    ) {
        parent::__construct($setId, $setName, $setType);
        $this->attributeId = $attributeId;
        $this->value = $value;
        $this->displayValue = $displayValue !== '' ? $displayValue : $value;
    }

    public function getId(): int
    {
        return $this->attributeId;
    }

    public function getSetId(): int
    {
        return parent::getId();
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
