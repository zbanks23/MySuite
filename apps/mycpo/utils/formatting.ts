export function formatSeconds(s: number) {
    const mm = Math.floor(s / 60)
        .toString()
        .padStart(2, "0");
    const ss = Math.floor(s % 60)
        .toString()
        .padStart(2, "0");
    return `${mm}:${ss}`;
}
