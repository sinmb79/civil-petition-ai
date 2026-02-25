export function createApp(petitionService) {
  return {
    async handleGet(urlPath) {
      const [path, queryString = ''] = urlPath.split('?');
      const match = path.match(/^\/api\/petitions\/([^/]+)\/similar$/);
      if (!match) return { status: 404, body: { message: 'Not found' } };
      const petitionId = decodeURIComponent(match[1]);
      const petition = petitionService.getPetition(petitionId);
      if (!petition) return { status: 404, body: { message: 'Petition not found' } };
      const params = new URLSearchParams(queryString);
      const parsed = Number(params.get('topK') ?? '5');
      const topK = Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 5;
      const results = await petitionService.findSimilarPetitions(petitionId, topK);
      return { status: 200, body: { petition_id: petitionId, count: results.length, results } };
    },
  };
}
