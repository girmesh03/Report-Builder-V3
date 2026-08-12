/**
 * @module components/auth/LoginForm
 *
 * The §48.3 LoginForm — the §46.2 form pattern: RHF `onBlur`
 * validation through the manual resolver (components/auth/
 * validators.js), fields `email` + `password` exactly (§48.6),
 * start adornments per the §48.3 table, submit "Log in" with the
 * MUI loading state ("Logging in…") while submitting.
 *
 * Empty-submit: the resolver marks both fields, focus moves to
 * `email`, nothing submits, no toast (normative, §48.3).
 * Success: the §28 login contract through the §42 layer; the store
 * listener lands `authenticated` (redux/app/store.js); toast
 * "Welcome back" (§41.2 decision 10); navigate to `state.from`
 * when present (same-site, decoded) else `/dashboard`.
 * Failure: toast with the §27 message — `setError` is never called
 * for server errors (§9.6/§42.4); no `reset()`, the form stays
 * filled. A 401 here is a login rejection (skipReauth, §42.3) and
 * is toasted, never treated as expiry.
 */
import PropTypes from "prop-types";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import MuiTextField from "../reusable/MuiTextField";
import MuiButton from "../reusable/MuiButton";
import { useLoginMutation } from "../../redux/features/authEndpoints";
import { showToast } from "../../utils/toast.jsx";
import { TOAST_CATALOGUE } from "../../utils/constants";
import { validateEmail, validatePassword } from "./validators";

const FIELD_ORDER = Object.freeze(["email", "password"]);

const loginResolver = (values) => {
  const errors = {};
  const emailError = validateEmail(values.email);
  if (emailError) {
    errors.email = { type: "manual", message: emailError };
  }
  const passwordError = validatePassword(values.password);
  if (passwordError) {
    errors.password = { type: "manual", message: passwordError };
  }
  const hasErrors = Object.keys(errors).length > 0;
  return { values: hasErrors ? {} : values, errors };
};

export default function LoginForm({ from }) {
  const navigate = useNavigate();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    setFocus,
    formState: { errors },
  } = useForm({
    mode: "onBlur",
    resolver: loginResolver,
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (values) => {
    try {
      await login({ email: values.email, password: values.password }).unwrap();
      showToast("success", TOAST_CATALOGUE.auth.loggedIn);
      if (from?.pathname) {
        navigate(`${from.pathname}${from.search ?? ""}`, { replace: true });
      } else {
        navigate("/dashboard", { replace: true });
      }
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
      <MuiButton type="submit" fullWidth loading={isLoading}>
        {isLoading ? "Logging in…" : "Log in"}
      </MuiButton>
    </Box>
  );
}

LoginForm.propTypes = {
  from: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
  }),
};
