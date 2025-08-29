import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/getAuthenticatedUser";
import { addToCollectionAction, updateCollectionQuantityAction, removeFromCollectionAction } from "../../actions/CollectionActions"
import CollectionClient from "./CollectionClient";

export default async function CollectionPage() {
  const user = await getAuthenticatedUser();

  if (!user) {
    return <p>Veuillez vous connecter pour accéder à cette page.</p>;
  }

  const userId = user.id;

  // Récupère (ou crée si vide) la collection par défaut du user
  let def = await prisma.collection.findFirst({
    where: { userId },
    include: { items: true },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
  });

  if (!def) {
    def = await prisma.collection.create({
      data: { userId, name: "Main", isDefault: true },
      include: { items: true },
    });
  }

  const initialItems = JSON.parse(JSON.stringify(def.items ?? []));

  return (
    <CollectionClient
      initialItems={initialItems}
      actions={{
        addToCollection: addToCollectionAction,
        updateCollectionQuantity: updateCollectionQuantityAction,
        removeFromCollection: removeFromCollectionAction,
      }}
    />
  );
}