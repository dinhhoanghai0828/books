import { useEffect, useState } from "react"


export const useHasMounted = () => {
    //  Tra ra true neu component da render
    //  Tra ra false neu component chua render
    const [hasMounted, setHasMounted] = useState<boolean>(false);
    useEffect(() => {
        setHasMounted(true);
    },[]);
    return hasMounted;
}