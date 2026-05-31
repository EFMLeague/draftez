import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

// Le pagine sono caricate in lazy così solo la rotta attiva inizializza il
// proprio socket (in Next ogni rotta era un bundle separato: stesso effetto).
const Home = lazy(() => import("./pages/Home"));
const Room = lazy(() => import("./pages/Room"));

export default function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/:name" element={<Room />} />
      </Routes>
    </Suspense>
  );
}
