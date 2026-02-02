import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import nprogress from "nprogress";

const TopLoader = () => {
    const location = useLocation();

    useEffect(() => {
        nprogress.configure({ showSpinner: false });

        nprogress.start();

        const timer = setTimeout(() => {
            nprogress.done();
        }, 300); // Small delay to make it visible

        return () => {
            clearTimeout(timer);
            nprogress.done();
        };
    }, [location]);

    return null;
};

export default TopLoader;
