async function main(): Promise<void> {
  console.info('Seed scaffold ready. No seed data inserted.');
}

main().catch((error) => {
  console.error('Seed failed', error);
  process.exit(1);
});
