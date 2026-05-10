import type { scrapeResponse } from "../types/types"
import WaitBar from "./resultBars/waitBar"
import ErreursBar from "./resultBars/erreurBar"
import LoadingBar from "./resultBars/loadingBar"
import ProductsBar from "./resultBars/productBar"

interface ResultBarProps{
        response: scrapeResponse | null;
        error: string | null;
        isloading: boolean;
}


export default function ResultsBar({response, error, isloading}: ResultBarProps){
    return (
        <section className="lg:col-span-3 border">
            {!response && !isloading && !error && <WaitBar />}
            {isloading && <LoadingBar />}
            {error && <ErreursBar erreur={error} />}
            {response && !isloading && <ProductsBar {...response} />}
        </section>
    )
};