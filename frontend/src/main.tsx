import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

async function testFirebase() {
  const querySnapshot = await getDocs(collection(db, "timetables"));
  console.log("Documents in timetables:", querySnapshot.docs.map(doc => doc.id));
}

testFirebase();

createRoot(document.getElementById("root")!).render(<App />);
