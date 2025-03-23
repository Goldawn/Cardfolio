'use client'

import NavBar from "./components/NavBar.js";
import styles from "./page.module.css";
import { useCurrencyContext } from "@/context/";

export default function Home() {
  
  const { currency, toggleCurrency } = useCurrencyContext();
  
  return (
  <div id="Homepage" className={styles.homepage}>
    <section className={styles.container}>
      <h1>Mes collections: {currency} </h1>
      <button onClick={toggleCurrency}>switch currency</button>
      <NavBar />
    </section>
  </div>
  );
}