//import { useLoaderData } from "@remix-run/react";
//
//type Interaction = {
//    id: string;
//    question: string;
//    answer: string;
//};
//
//export const meta = () => {
//    return [
//        { charset: "utf-8" },
//        {
//            title: "Geteilte Konversationen - Rahmenabkommen GPT",
//        },
//        {
//            description: "",
//        },
//        { viewport: "width=device-width,initial-scale=1" },
//    ];
//};
//
//export async function loader(): Promise<Response> {
//    const interactionsReq = await fetch(
//        "https://rahmenabkommen-gpt.ch/api/interactions"
//    );
//    const interactions = (await interactionsReq.json()) as Interaction[];
//    return Response.json({
//        interactions,
//    });
//}
//
//export default function Geteilt() {
//    const { interactions } = await useLoaderData<typeof loader>();
//
//    return interactions.map((interaction: Interaction) => (
//        <div key={interaction.id} className="p-4 border-b border-gray-200">
//            <h2 className="text-lg font-semibold">{interaction.question}</h2>
//            <p className="text-gray-600">{interaction.answer}</p>
//        </div>
//    ));
//}
