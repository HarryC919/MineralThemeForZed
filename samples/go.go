// Package samples demonstrates Go rendering: goroutines, channels, interfaces.
package samples

import (
	"context"
	"errors"
	"fmt"
	"math"
	"sync"
	"time"
)

const (
	MaxWorkers = 8
	DefaultTTL = 30 * time.Second
	epsilon    = 1.0e-9
	StatusOK   = 0x00
)

var ErrNotFound = errors.New("samples: not found")

type Number interface {
	~int | ~int64 | ~float64
}

type Store[T Number] struct {
	mu      sync.RWMutex
	data    map[string]T
	ttl     time.Duration
	enabled bool
}

func NewStore[T Number](ttl time.Duration) *Store[T] {
	return &Store[T]{
		data:    make(map[string]T),
		ttl:     ttl,
		enabled: true,
	}
}

func (s *Store[T]) Set(key string, value T) {
	s.mu.Lock()
	defer s.mu.Unlock()
	s.data[key] = value
}

func (s *Store[T]) Get(key string) (T, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	value, ok := s.data[key]
	if !ok {
		var zero T
		return zero, fmt.Errorf("get %q: %w", key, ErrNotFound)
	}
	return value, nil
}

func (s *Store[T]) Sum() (total float64) {
	for _, v := range s.data {
		total += float64(v)
	}
	return math.Round(total*100) / 100
}

func worker(ctx context.Context, id int, jobs <-chan string, results chan<- string) {
	for {
		select {
		case <-ctx.Done():
			return
		case job, ok := <-jobs:
			if !ok {
				return
			}
			time.Sleep(10 * time.Millisecond)
			results <- fmt.Sprintf("worker %d handled %q", id, job)
		}
	}
}

func Run() error {
	ctx, cancel := context.WithTimeout(context.Background(), DefaultTTL)
	defer cancel()

	store := NewStore[float64](DefaultTTL)
	store.Set("pi", 3.14159)
	store.Set("e", 2.71828)
	store.Set("sqrt2", 1.41421)

	jobs := make(chan string, 16)
	results := make(chan string, 16)

	var wg sync.WaitGroup
	for i := range MaxWorkers {
		wg.Add(1)
		go func(id int) {
			defer wg.Done()
			worker(ctx, id, jobs, results)
		}(i)
	}

	items := []string{"pi", "e", "sqrt2", "missing"}
	for _, item := range items {
		jobs <- item
	}
	close(jobs)

	go func() {
		wg.Wait()
		close(results)
	}()

	for result := range results {
		fmt.Println(result)
	}

	if _, err := store.Get("missing"); err != nil {
		if errors.Is(err, ErrNotFound) {
			fmt.Printf("sum=%.2f 0x%X %v\n", store.Sum(), int32(0xDEADBEEF), store.enabled)
		}
	}
	return nil
}
