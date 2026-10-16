const fs = require('fs');
const path = require('path');

async function main() {
  const reqRes = await fetch('http://localhost:3030/api/requests');
  const reqData = await reqRes.json();
  const requests = reqData.requests || [];
  const settings = reqData.settings || {};

  const viewRes = await fetch('http://localhost:3030/api/viewers');
  const viewData = await viewRes.json();
  const viewers = viewData.viewers || [];

  function sqlEscape(val) {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'boolean') return val ? 1 : 0;
    if (typeof val === 'number') return val;
    return `'${String(val).replace(/'/g, "''")}'`;
  }

  const sqlStatements = [];

  // Insert settings
  for (const [key, value] of Object.entries(settings)) {
    const stringVal = typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    sqlStatements.push(
      `INSERT OR REPLACE INTO settings (\`key\`, \`value\`, \`updated_at\`) VALUES (${sqlEscape(key)}, ${sqlEscape(stringVal)}, ${sqlEscape(new Date().toISOString())});`
    );
  }

  // Insert viewers
  for (const v of viewers) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO viewers (\`id\`, \`name\`, \`total_requests\`, \`created_at\`, \`last_seen_at\`) VALUES (${sqlEscape(v.id)}, ${sqlEscape(v.name)}, ${v.totalRequests || 0}, ${sqlEscape(v.createdAt)}, ${sqlEscape(v.lastSeenAt)});`
    );
  }

  // Insert requests
  for (const r of requests) {
    sqlStatements.push(
      `INSERT OR REPLACE INTO requests (\`id\`, \`viewer_name\`, \`request_type\`, \`cosplay_sub_type\`, \`details\`, \`youtube_video_id\`, \`youtube_title\`, \`is_fast_track\`, \`fast_tracked_at\`, \`status\`, \`source\`, \`added_by\`, \`created_at\`, \`completed_at\`, \`order\`) VALUES (${sqlEscape(r.id)}, ${sqlEscape(r.viewerName)}, ${sqlEscape(r.requestType)}, ${sqlEscape(r.cosplaySubType)}, ${sqlEscape(r.details)}, ${sqlEscape(r.youtubeVideoId)}, ${sqlEscape(r.youtubeTitle)}, ${r.isFastTrack ? 1 : 0}, ${sqlEscape(r.fastTrackedAt)}, ${sqlEscape(r.status)}, ${sqlEscape(r.source)}, ${sqlEscape(r.addedBy)}, ${sqlEscape(r.createdAt)}, ${sqlEscape(r.completedAt)}, ${r.order !== undefined ? r.order : 'NULL'});`
    );
  }

  const outputPath = path.join(__dirname, 'seed-d1.sql');
  fs.writeFileSync(outputPath, sqlStatements.join('\n'), 'utf-8');
  console.log(`Successfully generated ${sqlStatements.length} SQL statements at ${outputPath}`);
}

main().catch(console.error);
