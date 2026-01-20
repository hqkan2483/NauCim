/*
  Drop obsolete link tables.

  LinkModel/LinkProfile are deprecated and no longer used.
*/
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

DROP TABLE IF EXISTS "LinkModel";
DROP TABLE IF EXISTS "LinkProfile";

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
