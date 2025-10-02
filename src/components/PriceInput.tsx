import React, { useState } from "react";
import { Input, Dropdown, Menu, Button } from "antd";
import { DollarOutlined, FunctionOutlined } from "@ant-design/icons";

type Mode = "currency" | "formula";

const VARIABLES = ["COMEX", "LME", "SHFE", "NYMEX", "CASH", "SPOT", "FUTURES"];

interface PriceInputProps {
  value: string | number;
  onChange: (value: string | number) => void;
  mode?: Mode;
  onModeChange?: (mode: Mode) => void;
}

export const PriceInput: React.FC<PriceInputProps> = ({
  value,
  onChange,
  mode: externalMode,
  onModeChange
}) => {
  const [internalMode, setInternalMode] = useState<Mode>("currency");
  
  const mode = externalMode || internalMode;
  
  const handleModeToggle = (newMode: Mode) => {
    if (onModeChange) {
      onModeChange(newMode);
    } else {
      setInternalMode(newMode);
    }
    
    // Reset value when switching to currency mode, set "$" for formula mode
    if (newMode === "currency") {
      onChange(0);
    } else {
      onChange("$");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
  };

  // Dropdown menu for variables
  const menu = (
    <Menu
      onClick={(info) => {
        const variable = info.key as string;
        const currentValue = typeof value === 'string' ? value : '';
        const newValue = currentValue.replace('$', `$${variable}`);
        onChange(newValue);
      }}
      items={VARIABLES.map((v) => ({ key: v, label: v }))}
    />
  );

  const inputAddon = (
    <div style={{ display: "flex" }}>
      <Button
        type={mode === "currency" ? "primary" : "default"}
        icon={<DollarOutlined />}
        onClick={() => handleModeToggle("currency")}
        style={{ 
          borderRadius: mode === "currency" ? "4px 0 0 4px" : "0",
          fontSize: "12px",
          height: "32px",
          padding: "4px 8px"
        }}
      />
      <Button
        type={mode === "formula" ? "primary" : "default"}
        icon={<FunctionOutlined />}
        onClick={() => handleModeToggle("formula")}
        style={{ 
          borderRadius: mode === "formula" ? "0 4px 4px 0" : "0",
          fontSize: "12px",
          height: "32px",
          padding: "4px 8px"
        }}
      />
    </div>
  );

  const shouldShowDropdown = mode === "formula" && 
    (typeof value === 'string' && value.includes("$"));

  return (
    <Dropdown
      overlay={menu}
      trigger={["click"]}
      open={shouldShowDropdown}
      placement="bottomLeft"
    >
      <Input
        addonBefore={inputAddon}
        value={typeof value === 'string' ? value : String(value)}
        placeholder={mode === "currency" ? "Enter price (e.g. 3.45)" : "Enter formula (e.g. $COMEX)"}
        onChange={handleChange}
        style={{ 
          width: "100%",
          textAlign: "right"
        }}
      />
    </Dropdown>
  );
};
