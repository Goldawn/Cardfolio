import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import DecklistClient from "./DecklistClient";

export default async function DecklistPage() {

  const user = await getAuthenticatedUser();
  if (!user) {
    return <p>Veuillez vous connecter.</p>;
  }
  const userId = user.id;

  // Charge les decks du user
  const decklists = await prisma.decklist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      colors: true,
      showcasedDeckCardId: true,
      showcasedArt: true,
      format: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // console.log("Decklists:", decklists);

  const initialDecks = JSON.parse(JSON.stringify(decklists));

  // --- Server Action: créer un deck ---
  async function createDeckAction(name) {
    "use server";
    const authed = await getAuthenticatedUser({ throwError: true });

    if (!name || typeof name !== "string" || !name.trim()) {
      throw new Error("Nom de deck invalide.");
    }

    const created = await prisma.decklist.create({
      data: {
        userId: authed.id,
        name: name.trim(),
        colors: "[]",
        showcasedDeckCardId: null,
        // format: "commander",
      },
      select: {
        id: true,
        name: true,
        colors: true,
        // showcasedCard: true,
        format: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return JSON.parse(JSON.stringify(created));
  }

  return (
    <>
      <h1>My decks</h1>
      <DecklistClient
        initialDecks={initialDecks}
        actions={{ createDeck: createDeckAction }}
      />
    </>
  );
}
