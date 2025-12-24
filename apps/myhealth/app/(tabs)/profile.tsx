import { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth, supabase } from '@mycsuite/auth';
import { SharedButton, useUITheme, ThemedText, ThemedView } from '@mycsuite/ui';
import { useRouter } from 'expo-router';
import { IconSymbol } from '../../components/ui/icon-symbol';
import { BodyWeightCard } from '../../components/profile/BodyWeightCard';
import { WeightLogModal } from '../../components/profile/WeightLogModal';
import { ScreenHeader } from '../../components/ui/ScreenHeader';

type DateRange = 'Day' | 'Week' | 'Month' | 'Year';

export default function ProfileScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [latestWeight, setLatestWeight] = useState<number | null>(null);
  const [weightHistory, setWeightHistory] = useState<{ value: number; label: string; date: string }[]>([]);
  const [isWeightModalVisible, setIsWeightModalVisible] = useState(false);
  const [selectedRange, setSelectedRange] = useState<DateRange>('Month');
  const theme = useUITheme();
  
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data, error }) => {
          if (error) console.log('Error fetching profile:', error);
          if (data) {
            setUsername(data.username);
            setFullName(data.full_name);
          }
        });
    }
  }, [user]);

  const fetchLatestWeight = useCallback(async () => {
    if (!user) return;
    
    // Fetch the most recent weight entry
    const { data: latestData, error: latestError } = await supabase
      .from('body_measurements')
      .select('weight')
      .eq('user_id', user.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestError) {
        console.log('Error fetching weight:', latestError);
    } else if (latestData) {
        setLatestWeight(latestData.weight);
    }
  }, [user]);

  // Helper to get week start date (Sunday) using UTC to avoid timezone shifts
  const getWeekStartDate = (dateInput: Date | string) => {
    // If input is a string YYYY-MM-DD, it parses as UTC midnight.
    // If input is a Date object (curr time), it is absolute time.
    // We want to operate on the "Day" represented by the input.
    // Safest: Convert to YYYY-MM-DD string first (Local), then parse as UTC.
    
    // Let's standardize: Extract YYYY-MM-DD from input.
    let dateStr = '';
    if (typeof dateInput === 'string') {
        dateStr = dateInput;
    } else {
        // use local date for 'now'
        const year = dateInput.getFullYear();
        const month = String(dateInput.getMonth() + 1).padStart(2, '0');
        const day = String(dateInput.getDate()).padStart(2, '0');
        dateStr = `${year}-${month}-${day}`;
    }

    const dUtc = new Date(dateStr); // UTC Midnight
    const day = dUtc.getUTCDay(); // 0 (Sun) - 6 (Sat)
    const diff = dUtc.getUTCDate() - day;
    const s = new Date(dUtc);
    s.setUTCDate(diff);
    return s.toISOString().split('T')[0];
  };

  // Helper to format date label
  const formatDateLabel = (dateStr: string, range: DateRange) => {
      // Use UTC to prevent off-by-one errors when formatting labels
      // toLocaleDateString uses local timezone of device.
      // If dateStr="2025-12-24" (UTC), and we are EST. date Obj is Dec 23 19:00.
      // label becomes Dec 23. This IS confusing.
      // We want label "Dec 24".
      
      const d = new Date(dateStr);
      const utcDate = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      
      if (range === 'Week' || range === 'Year') return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      if (range === 'Month') return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      return utcDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  const fetchWeightHistory = useCallback(async () => {
    if (!user) return;

    // 1. Generate Spine (Target Dates)
    let spine: string[] = [];
    const now = new Date();
    // Get "Today" as YYYY-MM-DD string (Local)
    const todayY = now.getFullYear();
    const todayM = String(now.getMonth() + 1).padStart(2, '0');
    const todayD = String(now.getDate()).padStart(2, '0');
    const todayStr = `${todayY}-${todayM}-${todayD}`;

    if (selectedRange === 'Day') {
        // Last 17 days (16 intervals, divisible by 4)
        const d = new Date(todayStr); // UTC Mid
        for (let i = 16; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === 'Week') {
        // Last 13 weeks (12 intervals, divisible by 4)
        const currentWeekStartStr = getWeekStartDate(todayStr);
        const d = new Date(currentWeekStartStr);
        for (let i = 12; i >= 0; i--) {
             const temp = new Date(d);
             temp.setUTCDate(d.getUTCDate() - (i * 7));
             spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === 'Month') {
        // Last 33 days (32 intervals)
        const d = new Date(todayStr);
        for (let i = 32; i >= 0; i--) {
            const temp = new Date(d);
            temp.setUTCDate(d.getUTCDate() - i);
            spine.push(temp.toISOString().split('T')[0]);
        }
    } else if (selectedRange === 'Year') {
        // Last 13 months
        const currentMonthStartStr = `${todayY}-${todayM}-01`;
        const d = new Date(currentMonthStartStr);
        for (let i = 12; i >= 0; i--) {
             const temp = new Date(d);
             temp.setUTCMonth(d.getUTCMonth() - i);
             spine.push(temp.toISOString().split('T')[0].substring(0, 7) + '-01'); 
        }
    }

    // 2. Fetch Data
    let query = supabase
      .from('body_measurements')
      .select('weight, date')
      .eq('user_id', user.id);

        if (spine.length > 0) {
            query = query.gte('date', spine[0]).order('date', { ascending: true });
        }

    const { data: rawData, error } = await query;
      
    if (error) {
        console.log('Error fetching weight history:', error);
        return;
    }

    if (!rawData || rawData.length === 0) {
        setWeightHistory([]);
        return;
    }

    // 3. Process Data (Aggregation)
    // Re-loop for correct average calculation
    const groups: Record<string, { total: number, count: number }> = {};
    rawData.forEach(item => {
        let key = item.date;
        if (selectedRange === 'Week') key = getWeekStartDate(item.date); // item.date is YYYY-MM-DD
        else if (selectedRange === 'Year') key = item.date.substring(0, 7) + '-01';
        else key = item.date; // Day and Month use individual days

        if (!groups[key]) groups[key] = { total: 0, count: 0 };
        groups[key].total += item.weight;
        groups[key].count += 1;
    });


    // 4. Fill Spine & Interpolate -> NO BACKFILL.
    // Just map existing data to their positions in the spine.
    
    const result: { value: number; label: string; date: string; spineIndex: number }[] = [];
    
    spine.forEach((date, index) => {
        if (groups[date]) {
             // 5. Label Logic (Only if it falls on the 5 ticks)
             let label = '';
             const len = spine.length;
             const indices = [
                0,
                Math.floor((len - 1) * 0.25),
                Math.floor((len - 1) * 0.5),
                Math.floor((len - 1) * 0.75),
                len - 1
             ];
             
             if (indices.includes(index)) {
                 label = formatDateLabel(date, selectedRange);
             }

             result.push({
                 value: parseFloat((groups[date].total / groups[date].count).toFixed(2)),
                 label: label,
                 date: date,
                 spineIndex: index
             });
        }
    });

    setWeightHistory(result);
  }, [user, selectedRange]);

  useEffect(() => {
    if (user) {
        fetchLatestWeight();
    }
  }, [user, fetchLatestWeight]);

  useEffect(() => {
      if (user) {
          fetchWeightHistory().catch(err => console.error(err));
      }
  }, [user, fetchWeightHistory]);

  const handleSaveWeight = async (weight: number, date: Date) => {
    if (!user) return;

    const dateStr = date.toISOString().split('T')[0];

    // Check if entry exists for this date
    const { data: existingData, error: fetchError } = await supabase
        .from('body_measurements')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', dateStr)
        .maybeSingle();

    if (fetchError) {
        console.log('Error checking existing weight:', fetchError);
        return;
    }

    let error;

    if (existingData) {
        // Update existing
        const { error: updateError } = await supabase
            .from('body_measurements')
            .update({ weight: weight })
            .eq('id', existingData.id);
        error = updateError;
    } else {
        // Insert new
        const { error: insertError } = await supabase
            .from('body_measurements')
            .insert({
                user_id: user.id,
                weight: weight,
                date: dateStr,
            });
        error = insertError;
    }

    if (error) {
        console.log('Error saving weight:', error);
    } else {
        fetchLatestWeight(); // Refresh display
        fetchWeightHistory(); // Refresh chart
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };
  
  return (
    <ThemedView className="flex-1 p-4">
      <ScreenHeader 
        title="Profile" 
        rightAction={
            <TouchableOpacity onPress={() => router.push('/settings')}>
              <IconSymbol name="gearshape.fill" size={24} color={theme.text} />
            </TouchableOpacity>
        } 
      />
      
      <View className="mb-6">
        <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-500">Username</Text>
            <ThemedText className="text-lg font-medium">{username || 'Not set'}</ThemedText>
        </View>
        <View className="mb-4">
            <Text className="text-sm mb-1 text-gray-500">Full Name</Text>
            <ThemedText className="text-lg font-medium">{fullName || 'Not set'}</ThemedText>
        </View>
      </View>

      <BodyWeightCard 
        weight={latestWeight} 
        history={weightHistory}
        onLogWeight={() => setIsWeightModalVisible(true)} 
        selectedRange={selectedRange}
        onRangeChange={setSelectedRange}
        primaryColor={theme.primary}
        textColor={theme.placeholder}
      />

      <WeightLogModal
        visible={isWeightModalVisible}
        onClose={() => setIsWeightModalVisible(false)}
        onSave={handleSaveWeight}
      />

      <SharedButton title="Sign Out" onPress={handleSignOut} />
    </ThemedView>
  );
}