import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';

interface MathTextProps {
    text: string;
    className?: string;
}

const MathText = ({ text, className = '' }: MathTextProps) => {
    // If text is empty or null, return empty
    if (!text) return null;

    return (
        <span className={`math-text-container ${className}`}>
            <Latex>{text}</Latex>
        </span>
    );
};

export default MathText;
