import styles from "./ParticleField.module.css";

/** Pre-baked field for coarse pointer / reduced-motion — no three.js. */
export function StaticParticleFallback() {
  return (
    <div className={`${styles.fullPage} ${styles.fallback}`} aria-hidden="true">
      <img
        src="/particle-field.png"
        srcSet="/particle-field.png 1x, /particle-field@2x.png 2x"
        alt=""
        className={styles.fallbackImage}
        decoding="async"
      />
    </div>
  );
}
