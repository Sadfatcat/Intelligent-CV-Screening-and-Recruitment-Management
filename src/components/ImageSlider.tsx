"use client";

import { useState } from "react";
import { useEffect } from "react";
import Image from "next/image";

const images = [
    "/test1.png",
    "/test2.png",
    // "/fintlogo.png",
];

export default function ImageSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
            );
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? images.length - 1 : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev === images.length - 1 ? 0 : prev + 1
        );
    };

    const handleSelectImage = (index: number) => {
        setCurrentIndex(index);
    };

    return (
        <div style={styles.wrapper}>
            <div style={styles.slider}>
                <img
                    src={images[currentIndex]}
                    alt={`Slide ${currentIndex + 1}`}
                    style={styles.image}
                />

                <button onClick={handlePrev} style={styles.prevButton}>

                </button>

                <button onClick={handleNext} style={styles.nextButton}>

                </button>
            </div>

            <div style={styles.dotsContainer}>
                {images.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => handleSelectImage(index)}
                        style={{
                            ...styles.dot,
                            backgroundColor: currentIndex === index ? "#2563eb" : "#cbd5e1",
                        }}
                    />
                ))}
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        width: "100%",
        maxWidth: "700px",
        margin: "40px auto",
        padding: "0 24px",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "16px",
    },
    slider: {
        position: "relative",
        width: "100%",
        height: "420px",
        overflow: "hidden",
        borderRadius: "16px",
    },
    image: {
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
        borderRadius: "16px",
    },
    prevButton: {
        position: "absolute",
        top: "50%",
        left: "10px",
        transform: "translateY(-50%)",
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "#fff",
        border: "none",
        padding: "10px 12px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "30px",
        opacity: 0.2,
    },
    nextButton: {
        position: "absolute",
        top: "50%",
        right: "10px",
        transform: "translateY(-50%)",
        backgroundColor: "rgba(0,0,0,0.5)",
        color: "#fff",
        border: "none",
        padding: "10px 14px",
        borderRadius: "50%",
        cursor: "pointer",
        fontSize: "18px",
        opacity: 0.2,
    },
    dotsContainer: {
        display: "flex",
        gap: "10px",
    },
    dot: {
        width: "6px",
        height: "6px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
    },
};