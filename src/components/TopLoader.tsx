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
        }, 100); // reduced from 300ms for faster feedback

        return () => {
            clearTimeout(timer);
            nprogress.done();
        };
    }, [location]);

    return null;
};

export default TopLoader;
