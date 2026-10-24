/* Multi-line block comment
 * spanning several lines with keywords: if for return while
 */
#include <stdio.h>
#include <stdlib.h>
#include "custom_header.h"

#define MAX_ELEMENTS 100
#define SQUARE(x) ((x) * (x))
#define STRINGIFY(x) #x

typedef enum {
    STATUS_OK = 0,
    STATUS_ERROR = -1,
    STATUS_TIMEOUT = 0xFF
} Status;

typedef struct Point {
    int x;
    int y;
    char name[32];
    double weight;
} Point;

typedef union Value {
    int i;
    float f;
    char c;
} Value;

static const char *const GREETING = "Hello, \"World\"!\n";
static unsigned long long counter = 0xDEADBEEF;
static float ratio = 3.14159f;
static char bin = 0b10101010;

// Single-line comment: struct type, function definition
static inline int point_compare(const void *a, const void *b) {
    const Point *pa = (const Point *)a;
    const Point *pb = (const Point *)b;
    if (pa->x != pb->x) {
        return pa->x - pb->x;
    }
    return pa->y - pb->y;
}

int main(int argc, char **argv) {
    Point points[MAX_ELEMENTS];
    Value v;
    v.i = 42;
    register int i, j;
    volatile Status status = STATUS_OK;

    for (i = 0; i < MAX_ELEMENTS; i++) {
        points[i].x = i * 2;
        points[i].y = SQUARE(i) % 0x7F;
        snprintf(points[i].name, sizeof(points[i].name), "point-%03d", i);
    }

    qsort(points, MAX_ELEMENTS, sizeof(Point), point_compare);

    switch (status) {
        case STATUS_OK:
            printf("%s %d 0x%08X %g\n", GREETING, v.i, counter, ratio);
            break;
        case STATUS_ERROR:
            fprintf(stderr, "error: %s\n", strerror(errno));
            goto cleanup;
        default:
            break;
    }

    while (counter > 0 && j-- != 0) {
        counter >>= 1;
    }

    do {
        j++;
    } while (j < 10);

cleanup:
    free(points);
    return (int)status;
}
