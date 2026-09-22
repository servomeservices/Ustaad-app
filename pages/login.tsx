import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { postRequestOtp } from "../endpoints/auth/request-otp_POST.schema";
import { postVerifyOtp } from "../endpoints/auth/verify-otp_POST.schema";
import { setStoredToken } from "../helpers/authToken";
import styles from "./login.module.css";

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [devHint, setDevHint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requestOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await postRequestOtp({ phone });
      setDevHint(res.devHint ?? null);
      setStep("otp");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send code.");
    } finally {
      setBusy(false);
    }
  };

  const verifyOtp = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await postVerifyOtp({ phone, code });
      setStoredToken(res.token);
      navigate("/");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid code.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={styles.page}>
      <Helmet>
        <title>Servome — Technician Login</title>
      </Helmet>
      <div className={styles.card}>
        <div className={styles.appName}>Servome</div>
        <div className={styles.subtitle}>Technician login</div>

        {step === "phone" ? (
          <>
            <label className={styles.label} htmlFor="phone">
              Phone number
            </label>
            <div className={styles.phoneRow}>
              <span className={styles.prefix}>+91</span>
              <Input
                id="phone"
                value={phone}
                onChange={(e) =>
                  setPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))
                }
                placeholder="XXXXXXXXXX"
                inputMode="numeric"
                className={styles.input}
              />
            </div>
            {error ? <div className={styles.error}>{error}</div> : null}
            <Button
              className={styles.action}
              onClick={requestOtp}
              disabled={busy || phone.length !== 10}
            >
              Send code
            </Button>
          </>
        ) : (
          <>
            <label className={styles.label} htmlFor="code">
              6-digit code sent to +91{phone}
            </label>
            <Input
              id="code"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))
              }
              placeholder="000000"
              inputMode="numeric"
              className={styles.input}
            />
            {devHint ? (
              <div className={styles.devHint}>
                Dev mode (no SMS provider connected yet): your code is{" "}
                <strong>{devHint}</strong>
              </div>
            ) : null}
            {error ? <div className={styles.error}>{error}</div> : null}
            <Button
              className={styles.action}
              onClick={verifyOtp}
              disabled={busy || code.length !== 6}
            >
              Verify & log in
            </Button>
            <Button
              variant="ghost"
              className={styles.action}
              onClick={() => setStep("phone")}
              disabled={busy}
            >
              Change number
            </Button>
          </>
        )}
      </div>
    </div>
  );
}