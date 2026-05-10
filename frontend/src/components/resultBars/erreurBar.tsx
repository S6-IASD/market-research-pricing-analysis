

interface ErreurProps{
    erreur: string | null
}


export default function ErreursBar(/*{erreur}: {erreur: string | null}*/ {erreur}: ErreurProps) {
    return (
        <article className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 h-full">
            <p className="text-red-800 font-medium">Error: {erreur}</p>
                <p className="text-sm text-red-600 mt-1">
                  S'assurer que Django backend est en execution sur http://localhost:8000
                </p>
        </article>
    )
};