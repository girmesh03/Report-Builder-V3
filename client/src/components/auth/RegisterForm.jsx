/**
 * @module components/auth/RegisterForm
 *
 * The §48.4 RegisterForm: fields `email`, `password`,
 * `confirmPassword` exactly (§48.6 — no name field, no "Remember
 * me" anywhere), RHF `onBlur` via the manual resolver, password
 * confirmation client-only (the §28 contract receives only email +
 * password, §48.4/§46.2). Helper text under email states the §19.2
 * auto-extraction contract in chrome copy.
 *
 * Empty-submit: all three fields marked, focus moves to `email`,
 * nothing submits, no toast (§48.4).
 * Success (decision 11, §41.2): toast "Account created — please
 * log in", then `/login` — the client never auto-enters.
 * Failure: 409/duplicate and network errors toast the §27 message;
 * the form stays filled, no `reset()`, `setError` never used
 * (§42.4); `state.from` from a prior guard redirect is ignored —
 * post-register always lands on `/login` (§48.4 states).
 */
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import Typography from "@mui/material/Typography";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MuiTextField from "../reusable/MuiTextField";
import MuiButton from "../reusable/MuiButton";
import { useRegisterMutation } from "../../redux/features/authEndpoints";
import { showToast } from "../../utils/toast.jsx";
import { TOAST_CATALOGUE } from "../../utils/constants";
import {
  validateEmail,
  validatePassword,
  validateConfirmPassword,
} from "./validators";

const FIELD_ORDER = Object.freeze(["email", "password", "confirmPassword"]);

const registerResolver = (values) => {
  const errors = {};
  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = { type: "manual", message: emailError };
  }
  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = { type: "manual", message: passwordError };
  }
  const confirmError = validateConfirmPassword(
    values.confirmPassword,
    values.password,
  );
  if (confirmError) {
    errors.confirmPassword = { type: "manual", message: confirmError };
  }
  const hasErrors = Object.keys(errors).length > 0;
  return { values: hasErrors ? {} : values, errors };
};

export default function RegisterForm() {
  const navigate = useNavigate();
  const [registerAccount, { isLoading }] = useRegisterMutation();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    resolver: registerResolver,
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const onSubmit = async (values) => {
    try {
      await registerAccount({
        email: values.email,
        password: values.password,
      }).unwrap();
      showToast("success", TOAST_CATALOGUE.auth.accountCreated);
      navigate("/login", { replace: true });
    } catch (error) {
      showToast("error", error.message);
    }
  };

  const onInvalid = (formErrors) => {
    const first = FIELD_ORDER.find((name) => formErrors[name]);
    if (first) {
      setFocus(first);
    }
  };

  return (
    <Box
      component="form"
      noValidate
      onSubmit={handleSubmit(onSubmit, onInvalid)}
      sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 4 }}
    >
      <MuiTextField
        label="Email"
        placeholder="you@example.com"
        type="email"
        required
        error={Boolean(errors.email)}
        helperText={`${errors.email?.message ?? ""}\u00a0`}
        startAdornment={
          <InputAdornment position="start">
            <EmailOutlinedIcon fontSize="small" />
          </InputAdornment>
        }
        {...register("email")}
      />
      <Typography
        variant="caption"
        color="text.secondary"
        align="center"
        sx={{ mt: -1 }}
      >
        Your name is taken from your email (for example, beza.ayalew@gmail.com
        becomes Beza Ayalew).
      </Typography>
      <MuiTextField
        label="Password"
        type="password"
        required
        error={Boolean(errors.password)}
        helperText={`${errors.password?.message ?? ""}\u00a0`}
        startAdornment={
          <InputAdornment position="start">
            <LockOutlinedIcon fontSize="small" />
          </InputAdornment>
        }
        {...register("password")}
      />
      <MuiTextField
        label="Confirm password"
        type="password"
        required
        error={Boolean(errors.confirmPassword)}
        helperText={`${errors.confirmPassword?.message ?? ""}\u00a0`}
        startAdornment={
          <InputAdornment position="start">
            <LockOutlinedIcon fontSize="small" />
          </InputAdornment>
        }
        {...register("confirmPassword")}
      />
      <MuiButton type="submit" fullWidth loading={isLoading}>
        {isLoading ? "Creating account…" : "Sign up"}
      </MuiButton>
    </Box>
  );
}
