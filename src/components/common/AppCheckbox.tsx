import Checkbox, { type CheckboxProps } from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

export type AppCheckboxProps = CheckboxProps & {
  label?: string;
};

export function AppCheckbox({ label, ...checkboxProps }: AppCheckboxProps) {
  if (!label) {
    return <Checkbox {...checkboxProps} />;
  }

  return (
    <FormControlLabel control={<Checkbox {...checkboxProps} />} label={label} />
  );
}
