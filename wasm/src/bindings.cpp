/**
 * Emscripten bindings for WASM nesting module
 * 
 * Current implementation: AABB-based bottom-left placement with genetic optimization
 * Future: Integration with libnest2d for true No-Fit Polygon (NFP) nesting
 * 
 * The genetic algorithm shuffles part order and tries different rotations
 * to find better utilization. AABB collision detection is used for speed.
 */

#include <emscripten/bind.h>
#include <emscripten/val.h>
#include <vector>
#include <string>
#include <cmath>
#include <algorithm>
#include <random>
#include <chrono>
#include <functional>

using namespace emscripten;

// Forward declare progress callback type
using ProgressCallback = std::function<void(int iteration, int total, double utilization)>;

/**
 * Simple polygon representation
 * Points are stored as [x0, y0, x1, y1, ...]
 */
struct Polygon {
    std::vector<double> points;
    
    double minX() const {
        double m = points.empty() ? 0 : points[0];
        for (size_t i = 0; i < points.size(); i += 2) {
            m = std::min(m, points[i]);
        }
        return m;
    }
    
    double maxX() const {
        double m = points.empty() ? 0 : points[0];
        for (size_t i = 0; i < points.size(); i += 2) {
            m = std::max(m, points[i]);
        }
        return m;
    }
    
    double minY() const {
        double m = points.size() >= 2 ? points[1] : 0;
        for (size_t i = 1; i < points.size(); i += 2) {
            m = std::min(m, points[i]);
        }
        return m;
    }
    
    double maxY() const {
        double m = points.size() >= 2 ? points[1] : 0;
        for (size_t i = 1; i < points.size(); i += 2) {
            m = std::max(m, points[i]);
        }
        return m;
    }
    
    double width() const { return maxX() - minX(); }
    double height() const { return maxY() - minY(); }
    
    double area() const {
        // Shoelace formula for polygon area
        double a = 0;
        size_t n = points.size() / 2;
        for (size_t i = 0; i < n; i++) {
            size_t j = (i + 1) % n;
            a += points[i * 2] * points[j * 2 + 1];
            a -= points[j * 2] * points[i * 2 + 1];
        }
        return std::abs(a) / 2.0;
    }
    
    // Rotate polygon by angle (radians) around center
    Polygon rotated(double angle) const {
        Polygon result;
        result.points.reserve(points.size());
        
        double cx = (minX() + maxX()) / 2.0;
        double cy = (minY() + maxY()) / 2.0;
        double cosA = std::cos(angle);
        double sinA = std::sin(angle);
        
        for (size_t i = 0; i < points.size(); i += 2) {
            double x = points[i] - cx;
            double y = points[i + 1] - cy;
            result.points.push_back(x * cosA - y * sinA + cx);
            result.points.push_back(x * sinA + y * cosA + cy);
        }
        
        return result;
    }
    
    // Translate polygon
    Polygon translated(double dx, double dy) const {
        Polygon result;
        result.points.reserve(points.size());
        for (size_t i = 0; i < points.size(); i += 2) {
            result.points.push_back(points[i] + dx);
            result.points.push_back(points[i + 1] + dy);
        }
        return result;
    }
};

/**
 * Part to be nested
 */
struct NestPart {
    std::string id;
    Polygon polygon;
    int quantity;
};

/**
 * Placement result for a single part
 */
struct Placement {
    std::string partId;
    int sheetIndex;
    double x;
    double y;
    double rotation; // radians
};

/**
 * Configuration for nesting algorithm
 */
struct NestConfig {
    double sheetWidth;
    double sheetHeight;
    double spacing;       // Kerf/gap between parts
    int rotationSteps;    // Number of rotation angles to try (e.g., 4 = 0°, 90°, 180°, 270°)
    int iterations;       // Genetic algorithm generations
    int populationSize;   // GA population size
    double mutationRate;  // GA mutation probability
};

/**
 * Nesting result
 */
struct NestResult {
    std::vector<Placement> placements;
    int sheetsUsed;
    std::vector<double> utilization;
    int iterationsRun;
};

/**
 * Simple bottom-left placement with rotation
 */
class SimpleNester {
public:
    SimpleNester(const NestConfig& config) : config_(config) {}
    
    NestResult nest(const std::vector<NestPart>& parts, val progressCallback) {
        NestResult result;
        result.iterationsRun = 0;
        
        // Expand parts by quantity
        std::vector<std::pair<std::string, Polygon>> expanded;
        for (const auto& part : parts) {
            for (int i = 0; i < part.quantity; i++) {
                expanded.emplace_back(part.id, part.polygon);
            }
        }
        
        // Sort by area descending (largest first heuristic)
        std::sort(expanded.begin(), expanded.end(),
            [](const auto& a, const auto& b) {
                return a.second.area() > b.second.area();
            });
        
        // Best solution found
        std::vector<Placement> bestPlacements;
        double bestUtilization = 0;
        
        // Random engine for genetic algorithm
        std::mt19937 rng(std::chrono::steady_clock::now().time_since_epoch().count());
        std::uniform_real_distribution<double> dist(0.0, 1.0);
        
        // Generate rotation angles
        std::vector<double> rotations;
        for (int i = 0; i < config_.rotationSteps; i++) {
            rotations.push_back(i * (2.0 * M_PI / config_.rotationSteps));
        }
        
        // Genetic algorithm iterations
        for (int iter = 0; iter < config_.iterations; iter++) {
            result.iterationsRun = iter + 1;
            
            // Shuffle order for this iteration (genetic variation)
            if (iter > 0) {
                for (size_t i = expanded.size() - 1; i > 0; i--) {
                    if (dist(rng) < config_.mutationRate) {
                        size_t j = static_cast<size_t>(dist(rng) * (i + 1));
                        std::swap(expanded[i], expanded[j]);
                    }
                }
            }
            
            // Try to place all parts
            std::vector<Placement> placements;
            std::vector<std::vector<std::pair<double, double>>> sheetOccupancy; // Track placed rectangles per sheet
            
            for (const auto& [partId, polygon] : expanded) {
                bool placed = false;
                
                // Try each rotation
                for (double rotation : rotations) {
                    if (placed) break;
                    
                    Polygon rotated = polygon.rotated(rotation);
                    double partW = rotated.width() + config_.spacing;
                    double partH = rotated.height() + config_.spacing;
                    
                    // Try each existing sheet
                    for (size_t sheetIdx = 0; sheetIdx < sheetOccupancy.size() && !placed; sheetIdx++) {
                        // Simple bottom-left placement
                        double bestX = -1, bestY = -1;
                        
                        // Try positions in grid
                        for (double y = 0; y + partH <= config_.sheetHeight; y += 10) {
                            for (double x = 0; x + partW <= config_.sheetWidth; x += 10) {
                                bool collision = false;
                                
                                // Check against all placed parts on this sheet
                                // (simplified AABB collision)
                                for (const auto& [ox, oy] : sheetOccupancy[sheetIdx]) {
                                    // Note: This is simplified; real NFP would be more accurate
                                    if (std::abs(x - ox) < partW && std::abs(y - oy) < partH) {
                                        collision = true;
                                        break;
                                    }
                                }
                                
                                if (!collision) {
                                    bestX = x;
                                    bestY = y;
                                    break;
                                }
                            }
                            if (bestX >= 0) break;
                        }
                        
                        if (bestX >= 0) {
                            placements.push_back({partId, static_cast<int>(sheetIdx), bestX, bestY, rotation});
                            sheetOccupancy[sheetIdx].emplace_back(bestX, bestY);
                            placed = true;
                        }
                    }
                    
                    // Create new sheet if needed
                    if (!placed && partW <= config_.sheetWidth && partH <= config_.sheetHeight) {
                        sheetOccupancy.push_back({{0, 0}});
                        placements.push_back({partId, static_cast<int>(sheetOccupancy.size() - 1), 0, 0, rotation});
                        placed = true;
                    }
                }
            }
            
            // Calculate utilization
            double totalPartArea = 0;
            for (const auto& [id, poly] : expanded) {
                totalPartArea += poly.area();
            }
            double totalSheetArea = sheetOccupancy.size() * config_.sheetWidth * config_.sheetHeight;
            double utilization = totalSheetArea > 0 ? (totalPartArea / totalSheetArea) : 0;
            
            // Update best if improved
            if (utilization > bestUtilization) {
                bestUtilization = utilization;
                bestPlacements = placements;
            }
            
            // Report progress
            if (!progressCallback.isUndefined() && !progressCallback.isNull()) {
                progressCallback(iter + 1, config_.iterations, bestUtilization);
            }
        }
        
        result.placements = bestPlacements;
        result.sheetsUsed = 0;
        for (const auto& p : bestPlacements) {
            result.sheetsUsed = std::max(result.sheetsUsed, p.sheetIndex + 1);
        }
        
        // Calculate per-sheet utilization
        result.utilization.resize(result.sheetsUsed, 0);
        for (int s = 0; s < result.sheetsUsed; s++) {
            double sheetPartArea = 0;
            for (size_t i = 0; i < expanded.size(); i++) {
                if (bestPlacements[i].sheetIndex == s) {
                    sheetPartArea += expanded[i].second.area();
                }
            }
            result.utilization[s] = sheetPartArea / (config_.sheetWidth * config_.sheetHeight);
        }
        
        return result;
    }
    
private:
    NestConfig config_;
};

// Embind bindings
EMSCRIPTEN_BINDINGS(libnest2d) {
    register_vector<double>("VectorDouble");
    register_vector<std::string>("VectorString");
    register_vector<Placement>("VectorPlacement");
    register_vector<NestPart>("VectorNestPart");
    
    value_object<Polygon>("Polygon")
        .field("points", &Polygon::points);
    
    value_object<NestPart>("NestPart")
        .field("id", &NestPart::id)
        .field("polygon", &NestPart::polygon)
        .field("quantity", &NestPart::quantity);
    
    value_object<Placement>("Placement")
        .field("partId", &Placement::partId)
        .field("sheetIndex", &Placement::sheetIndex)
        .field("x", &Placement::x)
        .field("y", &Placement::y)
        .field("rotation", &Placement::rotation);
    
    value_object<NestConfig>("NestConfig")
        .field("sheetWidth", &NestConfig::sheetWidth)
        .field("sheetHeight", &NestConfig::sheetHeight)
        .field("spacing", &NestConfig::spacing)
        .field("rotationSteps", &NestConfig::rotationSteps)
        .field("iterations", &NestConfig::iterations)
        .field("populationSize", &NestConfig::populationSize)
        .field("mutationRate", &NestConfig::mutationRate);
    
    value_object<NestResult>("NestResult")
        .field("placements", &NestResult::placements)
        .field("sheetsUsed", &NestResult::sheetsUsed)
        .field("utilization", &NestResult::utilization)
        .field("iterationsRun", &NestResult::iterationsRun);
    
    class_<SimpleNester>("SimpleNester")
        .constructor<NestConfig>()
        .function("nest", &SimpleNester::nest);
}
