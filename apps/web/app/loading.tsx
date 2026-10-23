import styles from "@/shared/ui/recovery/recovery.module.css";

export default function Loading() {
  return (
    <main className={styles.screen} aria-busy="true" role="status">
      <div className={styles.content}>
        <p className={styles.brand}>Nidio</p>
        <div className={styles.loader} aria-hidden="true">
          <span className={styles.pebble} />
          <span className={styles.pebble} />
        </div>
        <h1 className={styles.title}>Собираем ваш день.</h1>
        <p className={styles.description}>Планы, маленькие дела и всё, что вас объединяет.</p>
        <div className={styles.track} aria-hidden="true" />
        <span className={styles.hint}>Загрузка…</span>
      </div>
    </main>
  );
}
