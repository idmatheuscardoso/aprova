import { Suspense } from "react";
import { EntrarForm } from "./entrar-form";

export default function EntrarPage() {
  return (
    <Suspense>
      <EntrarForm />
    </Suspense>
  );
}
