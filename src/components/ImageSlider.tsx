"use client";

import { useState } from "react";
import { useEffect } from "react";
import Image from "next/image";

const images = [
    "/nghich1.png",
    "/usth1.png",
    "/usthquote.png",
];

export default function ImageSlider() {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev === images.length - 1 ? 0 : prev + 1
            );
        }, 5000);

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
                <div
                    style={{
                        ...styles.imageTrack,
                        transform: `translateX(-${currentIndex * 100}%)`,
                    }}
                >
                    {images.map((src, index) => (
                        <img
                            key={index}
                            src={src}
                            alt={`Slide ${index + 1}`}
                            style={styles.image}
                        />
                    ))}
                </div>

                <button onClick={handlePrev} style={styles.prevButton}>
                    &#10094;
                </button>

                <button onClick={handleNext} style={styles.nextButton}>
                    &#10095;
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
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative",
        padding: "20px",
        boxSizing: "border-box",
    },
    slider: {
        position: "relative",
        width: "100%",
        overflow: "hidden",
        borderLeft: "2px solid rgba(255, 255, 255, 0.3)", // Thêm border cho đẹp
        boxShadow: "-4px 0 15px rgba(0,0,0,0.1)", // Hiệu ứng nổi nhẹ
    },
    imageTrack: {
        display: "flex",
        width: "100%",
        transition: "transform 0.8s ease-in-out", // Hiệu ứng trượt ngang mượt mà
    },
    image: {
        flex: "0 0 100%", // Mỗi ảnh chỉ rộng đúng 100% không gian
        width: "100%",
        aspectRatio: "9/16", // Hoặc một tỷ lệ thích hợp cho thiết kế (ví dụ "4/3")
        objectFit: "cover", // Lấp đầy khung hình mà không để lại khoảng trắng
    },
    prevButton: {
        display: "none",
    },
    nextButton: {
        display: "none",
    },
    dotsContainer: {
        display: "none",
    },
    dot: {
        width: "12px",
        height: "12px",
        borderRadius: "50%",
        border: "none",
        cursor: "pointer",
        transition: "background-color 0.3s ease",
    },
};