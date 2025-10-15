#!/bin/bash

# Script to check Supabase usage in the frontend

echo "🔍 Checking for Supabase usage in frontend..."
echo ""

echo "📁 Files importing Supabase client:"
grep -r "from '@/integrations/supabase/client'" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Total files:"
echo ""

echo "📊 Files with database calls (supabase.from):"
grep -rl "supabase\.from(" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "🔑 Files with auth calls (supabase.auth):"
grep -rl "supabase\.auth\." src/ --include="*.tsx" --include="*.ts" | grep -v useAuth.tsx | head -10
echo ""

echo "📞 Files with function calls (supabase.functions):"
grep -rl "supabase\.functions" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "💾 Files with storage calls (supabase.storage):"
grep -rl "supabase\.storage" src/ --include="*.tsx" --include="*.ts" | head -10
echo ""

echo "✅ Files already using backend API:"
grep -rl "from '@/services/api'" src/ --include="*.tsx" --include="*.ts" | wc -l | xargs echo "  Total files:"
echo ""

echo "📝 Summary:"
echo "  - Check FRONTEND_MIGRATION_GUIDE.md for examples"
echo "  - Start with Auth, Profile, and Jobs pages"
echo "  - Use 'api' service from '@/services/api'"
echo "  - Clear browser localStorage after changes"

