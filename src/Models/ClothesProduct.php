<?php

namespace App\Models;

class ClothesProduct extends Product
{
    public const int CATEGORY_ID = 2;

    public function getFormattedAttributes(): array
    {
        $formatted = [];

        $formatAttr = function ($attr) {
            if (!is_object($attr))
                return null;
            $value = $attr->value ?? '';
            $display = $attr->displayValue ?? $value;
            return [
                'id' => (int) ($attr->id ?? 0),
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
