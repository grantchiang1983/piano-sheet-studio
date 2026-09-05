/**
 * Piano Sheet Studio - Song Repertoire Database
 * Accurate Grand Staff musical scores with pitch, beats, clef, and hands.
 */

const SONGS_DATABASE = [
    {
        id: 'bass_b_minor',
        title: '低音譜表律動 (B Minor Bass Ostinato)',
        composer: '低音伴奏練習 (依實體譜編制)',
        key: 'Bm',
        timeSignature: '4/4',
        bpm: 96,
        difficulty: '低音識譜 ★☆☆☆☆',
        description: '依據您上傳的樂譜編制：低音譜表、D大調/b小調(兩升號)、4/4拍。第1、3拍四分休止符，第2、4拍強奏第二線 B2 (Si) 保持音。',
        notes: [
            // Measure 1 (實體譜前奏)
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 1, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 1, beat: 2, tenuto: true },
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 1, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 1, beat: 4, tenuto: true },

            // Measure 2
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 2, tenuto: true },
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 4, tenuto: true },

            // Measure 3
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 2, tenuto: true },
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 4, tenuto: true },

            // Measure 4
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 2, tenuto: true },
            { pitch: 'rest', isRest: true, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 4, tenuto: true },

            // Measure 5 (右手旋律加入合奏)
            { pitch: 'F#4', midi: 66, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 5, beat: 2, tenuto: true },
            { pitch: 'D5', midi: 74, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 5, beat: 4, tenuto: true },

            // Measure 6
            { pitch: 'C#5', midi: 73, duration: 1, clef: 'treble', hand: 'right', measure: 6, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 6, beat: 2, tenuto: true },
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 6, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 6, beat: 4, tenuto: true },

            // Measure 7
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 7, beat: 2, tenuto: true },
            { pitch: 'F#4', midi: 66, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 1, clef: 'bass', hand: 'left', measure: 7, beat: 4, tenuto: true },

            // Measure 8 (b小調終止式)
            { pitch: 'B4', midi: 71, duration: 4, clef: 'treble', hand: 'right', measure: 8, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 4, clef: 'bass', hand: 'left', measure: 8, beat: 1 }
        ]
    },
    {
        id: 'twinkle',
        title: '小星星變奏曲 (Twinkle, Twinkle, Little Star)',
        composer: 'W. A. Mozart',
        key: 'C',
        timeSignature: '4/4',
        bpm: 100,
        difficulty: '入門 ★☆☆☆☆',
        description: '莫札特經典變奏曲主題，左右手協同演奏，非常適合初學五線譜識譜練習。',
        notes: [
            // Measure 1
            { pitch: 'C4', midi: 60, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 1 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 1 },
            { pitch: 'C4', midi: 60, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 2 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 3 },
            { pitch: 'E3', midi: 52, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 3 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 4 },

            // Measure 2
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 1 },
            { pitch: 'F3', midi: 53, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 2 },
            { pitch: 'G4', midi: 67, duration: 2, clef: 'treble', hand: 'right', measure: 2, beat: 3 },
            { pitch: 'E3', midi: 52, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 3 },

            // Measure 3
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 1 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 2 },
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 3 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 3 },
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 4 },

            // Measure 4
            { pitch: 'D4', midi: 62, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 1 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'D4', midi: 62, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 2 },
            { pitch: 'C4', midi: 60, duration: 2, clef: 'treble', hand: 'right', measure: 4, beat: 3 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 3 },

            // Measure 5
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 1 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 5, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 2 },
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 2, clef: 'bass', hand: 'left', measure: 5, beat: 3 },
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 5, beat: 4 },

            // Measure 6
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 6, beat: 1 },
            { pitch: 'A2', midi: 45, duration: 2, clef: 'bass', hand: 'left', measure: 6, beat: 1 },
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 6, beat: 2 },
            { pitch: 'D4', midi: 62, duration: 2, clef: 'treble', hand: 'right', measure: 6, beat: 3 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 6, beat: 3 },

            // Measure 7
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 1 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 7, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 2 },
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 3 },
            { pitch: 'B2', midi: 47, duration: 2, clef: 'bass', hand: 'left', measure: 7, beat: 3 },
            { pitch: 'F4', midi: 65, duration: 1, clef: 'treble', hand: 'right', measure: 7, beat: 4 },

            // Measure 8
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 8, beat: 1 },
            { pitch: 'A2', midi: 45, duration: 2, clef: 'bass', hand: 'left', measure: 8, beat: 1 },
            { pitch: 'E4', midi: 64, duration: 1, clef: 'treble', hand: 'right', measure: 8, beat: 2 },
            { pitch: 'D4', midi: 62, duration: 2, clef: 'treble', hand: 'right', measure: 8, beat: 3 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 8, beat: 3 }
        ]
    },
    {
        id: 'furelise',
        title: '給愛麗絲 (Für Elise)',
        composer: 'L. v. Beethoven',
        key: 'Am',
        timeSignature: '3/8',
        bpm: 112,
        difficulty: '進階 ★★☆☆☆',
        description: '貝多芬最具代表性的鋼琴小品，經典的半音階動機與左手流暢琶音。',
        notes: [
            // Pick-up / Intro
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 1 },
            { pitch: 'D#5', midi: 75, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 1.5 },
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 2 },
            { pitch: 'D#5', midi: 75, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 2.5 },
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 3 },
            { pitch: 'B4', midi: 71, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 3.5 },

            // Measure 2
            { pitch: 'D5', midi: 74, duration: 0.5, clef: 'treble', hand: 'right', measure: 2, beat: 1 },
            { pitch: 'C5', midi: 72, duration: 0.5, clef: 'treble', hand: 'right', measure: 2, beat: 1.5 },
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 2 },
            { pitch: 'A2', midi: 45, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'E3', midi: 52, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 2 },
            { pitch: 'A3', midi: 57, duration: 1, clef: 'bass', hand: 'left', measure: 2, beat: 3 },

            // Measure 3
            { pitch: 'C4', midi: 60, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 1 },
            { pitch: 'E4', midi: 64, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 2 },
            { pitch: 'A4', midi: 69, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 3 },
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 3.5 },
            { pitch: 'E2', midi: 40, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'E3', midi: 52, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 2 },
            { pitch: 'G#3', midi: 56, duration: 1, clef: 'bass', hand: 'left', measure: 3, beat: 3 },

            // Measure 4
            { pitch: 'E4', midi: 64, duration: 0.5, clef: 'treble', hand: 'right', measure: 4, beat: 1 },
            { pitch: 'G#4', midi: 68, duration: 0.5, clef: 'treble', hand: 'right', measure: 4, beat: 2 },
            { pitch: 'B4', midi: 71, duration: 0.5, clef: 'treble', hand: 'right', measure: 4, beat: 3 },
            { pitch: 'C5', midi: 72, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 3.5 },
            { pitch: 'A2', midi: 45, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'E3', midi: 52, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 2 },
            { pitch: 'A3', midi: 57, duration: 1, clef: 'bass', hand: 'left', measure: 4, beat: 3 },

            // Measure 5 - Theme recurrence
            { pitch: 'E4', midi: 64, duration: 0.5, clef: 'treble', hand: 'right', measure: 5, beat: 1 },
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 5, beat: 2 },
            { pitch: 'D#5', midi: 75, duration: 0.5, clef: 'treble', hand: 'right', measure: 5, beat: 2.5 },
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 5, beat: 3 },
            { pitch: 'D#5', midi: 75, duration: 0.5, clef: 'treble', hand: 'right', measure: 5, beat: 3.5 },

            // Measure 6
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 6, beat: 1 },
            { pitch: 'B4', midi: 71, duration: 0.5, clef: 'treble', hand: 'right', measure: 6, beat: 1.5 },
            { pitch: 'D5', midi: 74, duration: 0.5, clef: 'treble', hand: 'right', measure: 6, beat: 2 },
            { pitch: 'C5', midi: 72, duration: 0.5, clef: 'treble', hand: 'right', measure: 6, beat: 2.5 },
            { pitch: 'A4', midi: 69, duration: 1.5, clef: 'treble', hand: 'right', measure: 6, beat: 3 },
            { pitch: 'A2', midi: 45, duration: 1, clef: 'bass', hand: 'left', measure: 6, beat: 1 },
            { pitch: 'E3', midi: 52, duration: 1, clef: 'bass', hand: 'left', measure: 6, beat: 2 },
            { pitch: 'A3', midi: 57, duration: 1, clef: 'bass', hand: 'left', measure: 6, beat: 3 }
        ]
    },
    {
        id: 'ode_to_joy',
        title: '歡樂頌 (Ode to Joy)',
        composer: 'L. v. Beethoven',
        key: 'G',
        timeSignature: '4/4',
        bpm: 116,
        difficulty: '入門 ★☆☆☆☆',
        description: '第九號交響曲著名旋律，音域親民、節奏穩健，五線譜初學者的必備名曲。',
        notes: [
            // Measure 1
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 1 },
            { pitch: 'G3', midi: 55, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 1 },
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 2 },
            { pitch: 'C5', midi: 72, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 3 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 3 },
            { pitch: 'D5', midi: 74, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 4 },

            // Measure 2
            { pitch: 'D5', midi: 74, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 1 },
            { pitch: 'G3', midi: 55, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'C5', midi: 72, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 2 },
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 3 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 3 },
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 4 },

            // Measure 3
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 1 },
            { pitch: 'E3', midi: 52, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 2 },
            { pitch: 'A4', midi: 69, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 3 },
            { pitch: 'C3', midi: 48, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 3 },
            { pitch: 'B4', midi: 71, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 4 },

            // Measure 4
            { pitch: 'B4', midi: 71, duration: 1.5, clef: 'treble', hand: 'right', measure: 4, beat: 1 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'A4', midi: 69, duration: 0.5, clef: 'treble', hand: 'right', measure: 4, beat: 2.5 },
            { pitch: 'A4', midi: 69, duration: 2, clef: 'treble', hand: 'right', measure: 4, beat: 3 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 3 }
        ]
    },
    {
        id: 'canon',
        title: '卡農 (Canon in D)',
        composer: 'J. Pachelbel',
        key: 'D',
        timeSignature: '4/4',
        bpm: 78,
        difficulty: '中級 ★★★☆☆',
        description: '巴洛克音樂永恆名作，經典低音下行卡農和聲與優雅如歌的高音部旋律。',
        notes: [
            // Measure 1 - D Major
            { pitch: 'F#5', midi: 78, duration: 2, clef: 'treble', hand: 'right', measure: 1, beat: 1 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 1 },
            { pitch: 'E5', midi: 76, duration: 2, clef: 'treble', hand: 'right', measure: 1, beat: 3 },
            { pitch: 'A2', midi: 45, duration: 2, clef: 'bass', hand: 'left', measure: 1, beat: 3 },

            // Measure 2 - Bm -> F#m
            { pitch: 'D5', midi: 74, duration: 2, clef: 'treble', hand: 'right', measure: 2, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'C#5', midi: 73, duration: 2, clef: 'treble', hand: 'right', measure: 2, beat: 3 },
            { pitch: 'F#2', midi: 42, duration: 2, clef: 'bass', hand: 'left', measure: 2, beat: 3 },

            // Measure 3 - G -> D
            { pitch: 'B4', midi: 71, duration: 2, clef: 'treble', hand: 'right', measure: 3, beat: 1 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'A4', midi: 69, duration: 2, clef: 'treble', hand: 'right', measure: 3, beat: 3 },
            { pitch: 'D3', midi: 50, duration: 2, clef: 'bass', hand: 'left', measure: 3, beat: 3 },

            // Measure 4 - G -> A7
            { pitch: 'B4', midi: 71, duration: 2, clef: 'treble', hand: 'right', measure: 4, beat: 1 },
            { pitch: 'G2', midi: 43, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'C#5', midi: 73, duration: 2, clef: 'treble', hand: 'right', measure: 4, beat: 3 },
            { pitch: 'A2', midi: 45, duration: 2, clef: 'bass', hand: 'left', measure: 4, beat: 3 }
        ]
    },
    {
        id: 'minuet_in_g',
        title: 'G 大調小步舞曲 (Minuet in G)',
        composer: 'J. S. Bach',
        key: 'G',
        timeSignature: '3/4',
        bpm: 120,
        difficulty: '進階 ★★☆☆☆',
        description: '選自《安娜·瑪格達萊娜·巴哈音樂筆記》，三拍子圓舞步態與對位織體。',
        notes: [
            // Measure 1
            { pitch: 'D5', midi: 74, duration: 1, clef: 'treble', hand: 'right', measure: 1, beat: 1 },
            { pitch: 'G3', midi: 55, duration: 3, clef: 'bass', hand: 'left', measure: 1, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 2 },
            { pitch: 'A4', midi: 69, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 2.5 },
            { pitch: 'B4', midi: 71, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 3 },
            { pitch: 'C5', midi: 72, duration: 0.5, clef: 'treble', hand: 'right', measure: 1, beat: 3.5 },

            // Measure 2
            { pitch: 'D5', midi: 74, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 3, clef: 'bass', hand: 'left', measure: 2, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 2 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 2, beat: 3 },

            // Measure 3
            { pitch: 'E5', midi: 76, duration: 1, clef: 'treble', hand: 'right', measure: 3, beat: 1 },
            { pitch: 'C3', midi: 48, duration: 3, clef: 'bass', hand: 'left', measure: 3, beat: 1 },
            { pitch: 'C5', midi: 72, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 2 },
            { pitch: 'D5', midi: 74, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 2.5 },
            { pitch: 'E5', midi: 76, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 3 },
            { pitch: 'F#5', midi: 78, duration: 0.5, clef: 'treble', hand: 'right', measure: 3, beat: 3.5 },

            // Measure 4
            { pitch: 'G5', midi: 79, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 1 },
            { pitch: 'B2', midi: 47, duration: 3, clef: 'bass', hand: 'left', measure: 4, beat: 1 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 2 },
            { pitch: 'G4', midi: 67, duration: 1, clef: 'treble', hand: 'right', measure: 4, beat: 3 }
        ]
    }
];

window.SONGS_DATABASE = SONGS_DATABASE;
