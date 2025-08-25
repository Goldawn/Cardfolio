import { prisma } from "@/lib/prisma"

export default async function cardsPage() {
    
    const cards = await prisma.card.findMany();

    return (
    <div>
        Liste de mes cartes
        {cards.map((card) => (
            <p key={card.id}>{card.name}</p>
        ))}
    </div>
    )
}