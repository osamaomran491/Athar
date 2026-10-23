import { useState } from "react";

/**
 * Hook لإدارة الفورم:
 *  - values / errors / formError (رسالة عامة فوق الزرار)
 *  - onChange بيمسح error الحقل اللي بيتكتب فيه (ويدعم checkbox)
 *  - handleSubmit(validate, onValid):
 *      * لو validate رجّع errors → الحقول تهتز
 *      * onValid ممكن تكون async؛ لو رمت AuthError(field, msg) الرسالة بتظهر تحت الحقل ده
 */
export default function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [shakeTick, setShakeTick] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setValues((v) => ({ ...v, [name]: type === "checkbox" ? checked : value }));
    setErrors((er) => ({ ...er, [name]: "" }));
    setFormError("");
  };

  const handleSubmit = (validate, onValid) => async (e) => {
    e.preventDefault();
    setFormError("");
    const found = validate(values);
    setErrors(found);
    if (Object.keys(found).length) return setShakeTick((t) => t + 1);

    setSubmitting(true);
    try {
      await onValid(values);
    } catch (err) {
      if (err.field) setErrors({ [err.field]: err.message });
      else setFormError(err.message || "Something went wrong. Please try again");
      setShakeTick((t) => t + 1);
    } finally {
      setSubmitting(false);
    }
  };

  return { values, errors, formError, shakeTick, submitting, onChange, handleSubmit, setFormError };
}
