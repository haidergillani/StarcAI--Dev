import asyncio
import time
from processing import WarmupManager, get_scoresSA
import json
import matplotlib.pyplot as plt
from datetime import datetime
import os

def read_sample_text():
    """Read sample text from file"""
    script_dir = os.path.dirname(os.path.abspath(__file__))
    sample_file = os.path.join(script_dir, 'sample.txt')
    with open(sample_file, 'r') as f:
        return f.read()

def analyze_text(text):
    """Count sentences in text"""
    sentences = [s.strip() for s in text.split('.') if s.strip()]
    print(f"\nFound {len(sentences)} sentences in sample text")
    return sentences

async def measure_warmup():
    """Measure warmup duration"""
    print("\nWarming up instances (3 attempts)...")
    warmup_manager = WarmupManager()
    times = []
    
    for i in range(5):
        print(f"\nAttempt {i+1}:")
        start = time.time()
        await warmup_manager.warmup_all_instances()
        duration = time.time() - start
        print(f"{duration:.2f}s")
        times.append(duration)
        if i < 2:
            print("Cooling down...")
            await asyncio.sleep(10)
    
    avg = sum(times) / len(times)
    print(f"\nAverage warmup: {avg:.2f}s")
    return avg

async def measure_scoring_latency(sentences, num_sentences, runs=20):
    """Time how long it takes to score N sentences"""
    full_sentences = sentences * ((num_sentences // len(sentences)) + 1)
    test_text = '. '.join(full_sentences[:num_sentences]) + '.'
    
    times = []
    all_scores = []
    
    for i in range(runs):
        print(f"Run {i+1}/{runs}:", end=" ", flush=True)
        start = time.time()
        scores = await get_scoresSA(test_text)
        duration = time.time() - start
        print(f"{duration:.2f}s")
        
        times.append(duration)
        all_scores.append(scores)
        
        if i < runs-1:
            await asyncio.sleep(5)
    
    return {
        'avg_time': sum(times) / len(times),
        'times': times,
        'avg_per_sentence': sum(times) / len(times) / num_sentences,
        'scores': all_scores
    }

async def run_performance_test():
    """Run the full test suite"""
    sample_text = read_sample_text()
    sentences = analyze_text(sample_text)
    
    warmup_time = await measure_warmup()
    
    # Fine granularity to see parallelization effects clearly
    counts = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25]
    results = []
    
    print("\nTesting each count 5 times:")
    for count in counts:
        print(f"\nTesting {count} sentences...")
        stats = await measure_scoring_latency(sentences, count)
        results.append({
            'count': count,
            'stats': stats
        })
        print(f"Average: {stats['avg_time']:.2f}s")
        print(f"Per sentence: {stats['avg_per_sentence']:.3f}s")
    
    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f'results_{timestamp}.json', 'w') as f:
        json.dump({
            'sentences_in_sample': len(sentences),
            'warmup_time': warmup_time,
            'results': results
        }, f, indent=2)
    
    # Plot total time
    plt.figure(figsize=(10, 6))
    x = [r['count'] for r in results]
    y = [r['stats']['avg_time'] for r in results]
    plt.plot(x, y, 'bo-')
    plt.xlabel('Sentences')
    plt.ylabel('Seconds')
    plt.title('Total Processing Time')
    plt.grid(True)
    plt.savefig(f'total_time_{timestamp}.png')
    
    # Plot time per sentence
    plt.figure(figsize=(10, 6))
    y2 = [r['stats']['avg_per_sentence'] for r in results]
    plt.plot(x, y2, 'ro-')
    plt.xlabel('Batch Size')
    plt.ylabel('Seconds per Sentence')
    plt.title('Time per Sentence (lower is better)')
    plt.grid(True)
    plt.savefig(f'per_sentence_{timestamp}.png')
    plt.close('all')

if __name__ == "__main__":
    asyncio.run(run_performance_test()) 