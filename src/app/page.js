"use client"

import  { useSession, signOut } from "next-auth/react"
import NavBar from "./components/NavBar.js";
import styles from "./page.module.css";
import Link from "next/link"
import Image from "next/image"

export default function Home() {

  const { data: session } = useSession();
    
  return (

  <div id="Homepage" className={styles.homepage}>
    <section className={styles.container}>
      <h1>Mes collections</h1>
      {session?.user? (
        <>
          {session?.user?.image && (
            <Image
              src={session.user.image}
              alt="user avatar"
              width={50}
              height={50}
            />
          )}
          {session.user.name && (
            <span>{session.user.name}</span>
          )}
          <button onClick={() => signOut()}>Déconnexion</button>
        </>
      )
      : (
        <Link href="/login">
           <button>Connexion</button>
        </Link>
      )}
      <NavBar />
    </section>
  </div>

  );
}