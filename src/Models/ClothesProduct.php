<?php

namespace App\Models;

class ClothesProduct extends Product
{
    public const CATEGORY_ID = 2;

    public function getFormattedAttributes(): array
    {
        $formatted = [];

        $formatAttr = function ($attr) {
            if (!($attr instanceof Attribute))
                return null;
            $value = $attr->getValue() ?? '';
            $display = $attr->getDisplayValue() ?? $value;
            return [
                'id' => (int) ($attr->getId() ?? 0),
                'value' => $value,
                'displayValue' => $display,
            ];
        };

        foreach ($this->attributes as $attrSet) {
            if (!($attrSet instanceof AttributeSet))
                continue;

            $key = $attrSet->getName();
            $items = array_filter($attrSet->getAttributes());
            $formatted[$key] = array_map($formatAttr, $items);
        }

        return $formatted;
    }
}
