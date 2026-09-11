---
title: Paper formalization plan
description: A from-scratch Lean formalization plan for every proved result in KNOMP_complete_proofs_revised_2.tex, cross-referenced against the current state of KNOMP_Lean, with a list of places where the paper's own mathematics needs correction.
pubDate: 2026-08-25
tags: [math, lean, formalization]
---

A from-scratch formalization plan for every proved result in
`source/KNOMP_complete_proofs_revised_2.tex` (the "revised" draft, 2391
lines, 20 sections + model/notation), followed by a cross-reference
against what actually exists in `KNOMP_Lean/` today, and a consolidated
list of places where the paper's own mathematics — not just Lean/Mathlib
coverage — needs correction.

This file was written by ignoring the current Lean tree while drafting
Part A (the plan), then checking Part A against the tree for Part B. It
supersedes `VERIFICATION_REPORT.md` as the authoritative theorem-by-theorem
status snapshot (see "Relationship to other files" below) as of
2026-08-03, and consolidates `proposed_changes.md`'s content rather than
replacing it — `proposed_changes.md` remains the file to edit in place as
paper-math understanding evolves; this file is a point-in-time report.

**Headline numbers**, confirmed this session by direct `grep` for the
literal `sorry` tactic (not just the word "sorry", which also appears in
prose/docstrings): the project has exactly **5** open `sorry`s, **0**
`axiom`s, and **0** vacuous `True`-conclusion theorems, across **27**
`.lean` files covering all **32** numbered results (theorems / lemmas /
propositions / corollaries) in the paper, plus its supporting
Assumptions and Facts.

| # | Result | File | Line |
|---|--------|------|------|
| 1 | `lemma_wu` (Lemma `wu`, external CLT-style citation) | `AsymptoticEfficiency.lean` | 408 |
| 2 | `lemma_grid_accuracy` (Lemma `grid-accuracy`, literal `O_p(N^{-1/2})`) | `AsymptoticEfficiency.lean` | 460 |
| 3 | `keplerFamily_fisher_info_converges` (R2 of Assumption `regularity`, concrete Kepler family) | `KeplerFamily.lean` | 480 |
| 4 | `keplerFamily_limiting_criterion_separation` (R3, concrete Kepler family) | `KeplerFamily.lean` | 513 |
| 5 | `grid_argmax_increment_rate` (literal `O_p(N^{-1/2})` via dyadic annulus peeling) | `GridSearchIncrementRate.lean` | 326 |

A plan to close #3, #4, then #2 and #5 (#1 explicitly out of scope) was
separately approved and is on file at
`/home/adlucem/.claude/plans/snazzy-prancing-corbato.md`, paused mid-design
in favor of writing this report; it is not superseded and can be resumed.

---

## Relationship to other files in this directory

- `CLAUDE.md` — session orientation and standing house rules. Read first,
  always current.
- `SCRATCHPAD.md` — append-only chronological session log (2064 lines).
  Not fully re-read for this report; its content is, however, largely
  reproduced here because every `.lean` file's own header docstring
  already narrates the "approach taken" and any mid-session corrections
  in detail (docstrings were extracted and read in full for this report).
  Consult `SCRATCHPAD.md` directly for exact session boundaries/dates or
  narrative not captured in a file's own header.
- `VERIFICATION_REPORT.md` — an earlier point-in-time snapshot (per its
  own header, current as of an earlier session). Known stale in at least
  two respects as of this report: it lists `PeriastronSharpness.lean` as
  PARTIAL (it is now FULLY VERIFIED, 0 `sorry` — the calculus chain was
  fully derived in a later session), and it predates
  `GridSearchIncrementRate.lean` entirely (26-file inventory vs. the
  current 27). Treat *this* file as the current theorem-by-theorem
  snapshot; `VERIFICATION_REPORT.md` is superseded but left in place as
  historical record, per the project's "append, don't delete" spirit.
- `proposed_changes.md` — the living, edit-in-place list of paper-math
  gaps. Part C below consolidates and re-verifies its 4 existing entries
  rather than duplicating them from scratch; update `proposed_changes.md`
  itself, not this file, as understanding evolves further.

---

## Part A + Part B — Section-by-section plan and cross-reference

Each entry gives: **(A)** what a from-scratch Lean formalization of the
result would require — the genuine mathematical content, independent of
what exists — and **(B)** the actual current state: which file(s), what
was proved, and the specific technique used.

### Model and Notation (unnumbered, `.tex` model section)

**(A)** No standalone theorem; defines the observation model, noise
covariance `Σ(φ)`, the Keplerian atom `f(t;P,e,ω,T0)` (and its
`(u,v,M0)` reparameterization), the full design matrix `X`, weighted
least squares, and the detection statistic `ρ_W` (eq. `rhoW`). A
formalization plan needs these as shared definitions before any theorem
can be stated.

**(B)** `Common.lean` (plain WLS linear algebra: normal equations,
`ρ_W` as a quadratic form) and `Kepler.lean` (`keplerSolve`/Kepler's
equation via IVT+monotonicity, `keplerAtomOfE`, analyticity) supply
these. `Common.lean` deliberately defines symmetric-positive-definiteness
directly rather than via `Matrix.PosDef`, to avoid depending on
Mathlib simp-lemma behavior that could not be checked live in the
original sandboxed sessions. Both files: **0 `sorry`, 0 `axiom`**.

---

### §identifiability — Theorem `identifiability`

**(A)** Full column rank of the design matrix `X` outside a
Lebesgue-null exceptional set of design points, via: (1) restrict to a
finite evaluation-point subsystem, (2) real-analyticity of every column
function in the evaluation points + the identity theorem ⟹ either the
determinant is the zero function or its zero set is Lebesgue-null, (3)
rule out "identically zero" using Proposition `fourier`'s non-degeneracy
claim (§11) for the periodic-atom columns. This needs: a general
"nonzero real-analytic function on `ℝⁿ` has null zero set" lemma; a
general "linearly independent function family ⟹ some evaluation point
tuple gives a nonsingular matrix" lemma; and the specific non-degeneracy
fact from §11.

**(B)** `Identifiability.lean`, **0 `sorry`, 0 `axiom`**. Two supporting
general-purpose lemmas were built first: `AnalyticZeroMeasure.lean`
(nonzero-analytic-⟹-null-zero-set, by induction on dimension using
`MeasurableEquiv.piFinSuccAbove`) and `LinearIndependentEvaluation.lean`
(linear independence ⟹ nonsingular evaluation matrix exists, via
span/dimension induction + `Matrix.linearIndependent_cols_iff_isUnit`).
The main theorem `design_matrix_generically_full_rank` is stated
directly as the corrected "generic," not "any 3 points," claim (see
Part C below — the paper's own literal "any 3 points" wording is false
for `k ≥ 1`), gated behind an explicit `hli : LinearIndependent ℝ
(basisFunctions f)` hypothesis per house rule 4 rather than a `sorry`.
`hli` itself is proved for `k = 0` (`basisFunctions_linearIndependent_
of_k_eq_zero`, via `Fin.sum_univ_three`); the general `k ≥ 1` case is
real, open follow-on work (needs Vandermonde + a multi-atom extension of
`FourierStructure.lean`'s argument) — tracked in `CLAUDE.md` "Open work"
item 1, not a `sorry` in this file (it is an explicit unproved hypothesis,
which is the honest way to gate a real gap per house rule 4).

---

### §glrt — Theorem `glrt`

**(A)** Exact reduction `ΔJ = ρ_W(f)` for the weighted SSE improvement
from adding one candidate atom, via augmented normal equations + Schur
complement, or equivalently by profiling out the linear coefficients
first and completing the square in the new atom's own coefficient.

**(B)** `ExactDetectionIncrement.lean`, **0 `sorry`**. Took the
completing-the-square route rather than the Schur-complement route:
profile `β` first (`wls_optimality`/`wls_gap_eq` on the residualized
data `y - Kf`), then profile the scalar gain `K` by completing the
square (`quadratic_min_1d`) — mirrors the paper's own final-step
algebra rather than its Schur-complement framing, proving the identical
fact.

---

### §robust — Proposition `robust-grad`, Proposition `robust-hess`, Corollary `diag-case`

**(A)** Gradient of the profiled robust cost via the chain rule +
stationarity of `β̂(θ)` (an envelope-theorem argument); the Gauss-Newton
Hessian approximation; and the diagonal-`Σ` specialization of both.

**(B)** `RobustCostGradientHessian.lean`, **0 `sorry`**. The gradient
half reuses `VariableProjection.lean`'s general `envelope_theorem`
conceptually (not re-proved, to avoid duplicating the `β`-stationarity
argument); the remaining genuinely new content — differentiating
through the whitening transform `L⁻¹` — is finite-sum algebra proved
directly (`robust_hess_matrix_form`: `H = K²(L⁻¹∇f)ᵀ(L⁻¹∇f)`), taking
the paper's own stated Gauss-Newton truncation and `ψ'(z_i)→1`
approximation as explicit hypotheses (not re-derived — the paper itself
states these as approximations, not exact facts). An earlier draft of
this file only covered the gradient claim and half the corollary; a
coverage re-check against the source caught the missing Hessian
proposition, which was then added.

---

### §jitter — Proposition `jitter`, Corollary `jitter-search`

**(A)** Continuity of the profiled jitter log-likelihood `ℓ_d(s)` in the
jitter variance `s`, divergence as `s→∞`, existence of a global maximizer
via the extreme value theorem, and non-concavity (mixed-sign second
derivative somewhere) — hence no purely local method is guaranteed to
find the global max (Corollary).

**(B)** `JitterLikelihoodMaximizer.lean`, **0 `sorry`**. Uses the
paper's exact closed form `ℓ_d(s) = -½Σlog(σn²+s) - ½Σrn²/(σn²+s)`.
Non-concavity is split into two separate, independently provable facts:
(1) a universal large-`s` fact, `ℓ_d''(s) > 0` eventually (since the
log-det term's decay is asymptotically slower than the quadratic-residual
term's), and (2) a concrete witness showing `ℓ_d''(0) < 0` is achievable
for some data. An earlier version of this file (written before the
source `.tex` was available in that session) only proved an
abstract existence-only half with no precise formula; this was later
rewritten against the paper's actual formula.

---

### §convergence — Theorem `convergence` (a), (b), (c)

**(A)** (a) the potential `Φ` is non-increasing block-by-block; (b) only
finitely many planet-candidates are ever accepted; (c) `Φ` converges and
every limit point is stationary, via Zangwill's global convergence
theorem (an external, classical citation — Bertsekas 1999 / Zangwill
1969's abstract framework, not reproved from scratch).

**(B)** `GlobalConvergence.lean`. Parts (a)+(b): **proved**, via
`Nat.nth`/`Nat.nth_strictMono`/`Nat.nth_mem_of_infinite` to formalize
"only finitely many acceptances" as a property of the strictly-monotone
subsequence of accepted indices. Part (c): **axiomatized**, not
`sorry`'d — an explicit `ZangwillHypothesis` structure captures Zangwill's
theorem's own external hypotheses (this is the correct treatment of a
genuinely external classical citation per house rule 4: state the real
hypothesis, don't hide it), with `stationarity_holds` then a one-line
proved application of that hypothesis to KNOMP's specific setup. An
earlier version of the file only described this corollary in prose
without ever writing it down as a theorem; it is now a real (if
axiom-hypothesis-gated) statement. **STATUS: mixed** (proved core +
honestly axiomatized external citation) — 0 `sorry`.

---

### §efficiency — the largest section: Assumption `regularity` (R1–R3), Lemma `wu`, Fact `gaussian-concentration`, Lemma `grid-consistency`, Proposition `grid-rate`, Remark `snr-wall`, Assumption `increment`, Lemma `grid-accuracy`, Theorem `efficiency`

This section's plan is necessarily the most involved; each piece is
listed separately.

**Assumption `regularity` (R1 uniform 3rd-derivative bound, R2
normalized Fisher information converges to a fixed positive limit, R3a
global uniqueness of `θ0`, R3b local quadratic lower bound).**

**(A)** As stated in the paper, these are standing hypotheses asserted
with a one-sentence justification each, for the actual Kepler/KNOMP
model. A rigorous plan must (i) decide whether to formalize them as
abstract hypotheses (honest but leaves "does the real model satisfy
them" unanswered) or (ii) instantiate a concrete Kepler observation
family and prove them as real theorems about it. R1's real content is
*uniformity over the observation index `n`*, not mere per-`n`
boundedness (automatic by compactness+continuity). R3's real content is
a *quantitative* separation (a curvature constant), not mere qualitative
uniqueness — the paper conflates the two.

**(B)** Both routes were taken, in sequence. **Abstract route:**
`AsymptoticEfficiency.lean`'s `RegularityAssumption` structure — originally
all three fields typed `True` (i.e. free to construct for any model,
a hypothesis-side equivalent of a vacuous conclusion, flagged and fixed
per house rule 1) — now carries real `Prop`-typed fields over genuine
objects (`μ : ℕ → ℝ → ℝ`, `Θ : Set ℝ`, `θ0 σ : ℝ`, `I0 : ℝ≥0`). Two
companion lemmas discharge the honestly-automatic half of R1 and R3:
`bound_iteratedDeriv_of_continuousOn_of_isCompact` (per-`n` boundedness
from continuity+compactness — NOT the genuine uniformity-over-`n` content,
which remains an open hypothesis) and `unique_minimizer_of_quadratic_
lower_bound` (states precisely what quantitative constant would discharge
R3 honestly). **Concrete route:** `KeplerFamily.lean` builds a genuine
`d=1` (period-only) Keplerian family `keplerFamily he ω T0 K t n θ`, with
design points confined to a fixed baseline (`htbdd` — an explicit,
new hypothesis, since an unbounded baseline would falsify R1's uniform
bound). Against this concrete family: **R1 is a real, fully-proved
theorem, 0 `sorry`** (`keplerFamily_uniform_third_deriv_bound` — order-3
Faà di Bruno assembled by hand, bounded via the extreme value theorem +
elementary rational-function bounds, giving one `n`-independent constant
`C3`). **R2 and R3 are stated concretely but left `sorry`'d**
(`keplerFamily_fisher_info_converges`, `keplerFamily_limiting_criterion_
separation` — the two of the project's 5 open `sorry`s targeted by the
paused plan's Parts 1–2). R2's residual gap is a genuine modeling choice
(no fixed convention exists for how design points asymptotically fill the
baseline — grid vs. i.i.d. vs. other, all reasonable and mutually
inconsistent). R3's residual gap is *not new content* — it cites the
identical general-`k≥1` Fourier-non-degeneracy argument that
`Identifiability.lean`'s `hli` case needs, viewed from §7 instead of §4.

**Lemma `wu` (external citation, Jennrich 1969 / Wu 1981 consistency of
the MLE).**

**(A)** A weak-LLN-plus-identifiability argument for consistency of the
unconstrained (non-grid) global MLE. Historically blocked entirely:
Mathlib had no CLT at all when first investigated.

**(B)** `AsymptoticEfficiency.lean`'s `lemma_wu`: **open `sorry`**, #1 in
the headline table, explicitly out of scope per the user's own prior
instruction. **Update, load-bearing for future work:** a later session
bumped this project's toolchain to Lean/Mathlib `v4.32.2` specifically
because Mathlib merged a genuine CLT for i.i.d. real random variables
(`Mathlib/Probability/CentralLimitTheorem.lean`, upstreamed 2026-03-28,
confirmed present in this checkout). The "Mathlib has no CLT" blocker is
gone; actually matching its hypotheses to `lemma_wu`'s setup has not been
attempted and remains real, substantial follow-on work.

**Fact `gaussian-concentration` (BLM2013 Thm 5.6).**

**(A)** An external classical citation (concentration of Lipschitz
functions of Gaussian vectors) — used as a hypothesis elsewhere, not
itself a KNOMP-specific claim requiring proof.

**(B)** Used directly as the shape of the `hconc` hypothesis in
`GridSearchConcentration.lean` — not separately proved (correctly so:
it's an external citation, analogous to Zangwill's theorem in
`GlobalConvergence.lean`).

**Lemma `grid-consistency`.**

**(A)** Steps 1–6 of the paper's grid-accuracy argument: deterministic
drift bound + Gaussian-Lipschitz concentration (Fact `gaussian-concentration`)
+ union bound over the grid ⟹ the grid-search argmax is consistent
(`→ θ0` in probability) at any fixed radius.

**(B)** `GridSearchConcentration.lean`'s `grid_argmax_consistency`, **0
`sorry`, 0 `axiom`** — fully proved via triangle inequality + `hdrift` +
union bound + `tendsto_rpow_mul_exp_neg_mul_atTop_nhds_zero`. Exposed in
`AsymptoticEfficiency.lean` as `lemma_grid_accuracy_fixed_radius_
consistency`.

**Proposition `grid-rate` / Remark `snr-wall` (paper's own step 7, the
peeling/chaining argument toward the `O_p(N^{-1/2})` rate).**

**(A)** The paper's own step 7 claims that at the rate-relevant grid
resolution, the `Θ(1)`-order deterministic drift eventually dominates the
`Θ(√(N log N))` stochastic deviation bound, closing the rate via the same
union-bound machinery as steps 1–6.

**(B)** Attempted honestly and found to be a genuine dead end, not a
tooling gap: `GridSearchRate.lean`'s header documents, by working the
per-annulus bound through explicitly (not just restating the paper's
prose), that `Θ(1)` does **not** dominate `Θ(√(N log N))` — the reverse
holds, unboundedly. Any reorganization of the *same marginal* concentration
hypothesis (peeled over dyadic annuli or otherwise) hits an identical
signal-to-noise wall at radius `Θ(N^{-1/4})`, not `Θ(N^{-1/2})`. This is
Part C entry 1 below (a genuine paper-math error, not merely a Lean gap)
— and the paper's *own revised draft already concedes it explicitly*, as
Remark `snr-wall` (`.tex`, §efficiency): the revised paper states the
`Θ(1)` vs. `Θ(√(N log N))` claim is false as written and that the actual
wall is at `N^{-1/4}`, matching this project's independently-derived
finding exactly. What the attempt DOES deliver, fully proved, 0 `sorry`:
`grid_argmax_polynomial_rate`, a genuine strengthening of fixed-radius
consistency to any `N^{-γ}` for every `γ < 1/4`.

**Assumption `increment` (the paper's own revised-draft fix: a stronger,
joint/pairwise increment-concentration hypothesis on `θ↦g(θ)-g(θ')`,
threshold scaling with `|θ-θ'|`, replacing the marginal-only
`gaussian-concentration` bound at the rate-relevant step).**

**(A)** Exactly the "materially different, stronger hypothesis" needed
to cross the `N^{-1/4}` wall — a chaining/metric-entropy-style argument
(in the spirit of van der Vaart & Wellner 1996) rather than a flat union
bound.

**(B)** `GridSearchIncrementRate.lean`'s `hinc` hypothesis formalizes
this directly from the revised draft's own statement. Per-point threshold
calibration against each grid point's own distance `rθ := |θ-θ0|` gives
a tail exponent quadratic in `rθ` (vs. the marginal case's quartic wall);
because `rθ ≥ r` for every point counted at filter radius `r` and `exp`
is monotone, this collapses to a single θ-independent bound usable with
the same flat cardinality hypothesis `hGcard` as the marginal case (no
density hypothesis needed for this weaker result). Delivers
`grid_argmax_increment_polynomial_rate`, **fully proved, 0 `sorry`**,
reaching every `γ < 1/2` — a real improvement over the marginal-hypothesis
ceiling of `γ < 1/4`.

**Lemma `grid-accuracy` (the paper's literal target: exact `O_p(N^{-1/2})`
via dyadic annulus peeling under Assumption `increment`, needing a new
local-density hypothesis `hGdensity` strictly stronger than the flat
`hGcard`).**

**(A)** Peel the increment-concentration bound over dyadic annuli
(rather than a single shrinking radius), using a local density hypothesis
on how many grid points fall in each annulus, to recover the exact rate
rather than every-`γ<1/2`.

**(B)** `GridSearchIncrementRate.lean`'s `grid_argmax_increment_rate`:
**open `sorry`**, #5 in the headline table, precisely stated (including
the new `hGdensity` hypothesis) but not proved — the missing step is
bounding a series simultaneously polynomial and doubly-exponential in the
annulus index, a genuine additional real-analysis gap, comparable in
scope to the CLT gap, not a routine extension of the polynomial-rate
proof. `AsymptoticEfficiency.lean`'s own `lemma_grid_accuracy` (#2 in the
headline table) is the paper's literal claim restated abstractly (just
`hreg`, no concrete grid/argmax hypotheses) and remains `sorry`'d,
cross-referencing both of the above results in its docstring but not
rewired to either (that rewiring is real, separate follow-on work — see
the paused plan's Part 4).

**Theorem `efficiency` (main result — one damped Newton step from an
`O_p(N^{-1/2})`-accurate start achieves asymptotic efficiency; includes a
numerical-validation remark).**

**(A)** A Slutsky-type argument chaining the grid-search's rate (Lemma
`grid-accuracy`) with a local Newton-step expansion and the asymptotic
normality of the (unconstrained) MLE (Lemma `wu`).

**(B)** `AsymptoticEfficiency.lean`'s `one_step_newton_asymptotically_
efficient` — proved modulo its own upstream dependencies (`lemma_wu`,
`lemma_grid_accuracy`, both open `sorry`s as above), via a new reusable
`slutsky_perturbation` lemma (whose own single internal sorry — a small
ℝ≥0/ℝ≥0∞ coercion-commutes-with-liminf step — was closed in an earlier
session, per `SCRATCHPAD.md`'s "Session 1 (cont.)" entry) and a new
general `ennreal_limsup_add_le` lemma (proved from scratch via
`iInf`/`iSup` unfolding, since the general `ConditionallyCompleteLinearOrder`
version of `limsup_add_le` times out on `ENNReal` even with explicit
boundedness side conditions). An earlier version of this theorem was
missing an explicit hypothesis connecting `θ̂₁` (the one-step estimator)
to the other estimators in the chain; this was caught and fixed.
The numerical-validation remark (variances 574.9→358.5→315.5 vs.
355.7→321.6→312.7 at `N=200,800,3200`) is expository and not itself a
claim requiring formalization.

---

### §bic — Theorem `bic`

**(A)** BIC model-selection consistency: an under-fitting bound (BIC
penalty dominates a missed-signal sum of squares) and an over-fitting
bound (probability of accepting a spurious extra term → 0).

**(B)** `BICConsistency.lean`. Under-fitting half
(`sum_dominates_log_penalty`): **fully proved**, purely deterministic.
Over-fitting half (`overfitting_prob_tendsto_zero`): **fully proved**,
via Theorem `family-wise` (§17) plus a squeeze argument. Neither half is
connected to an actual random KNOMP-specific data-generating process end
to end — both are proved as the general deterministic/probabilistic
facts the paper's argument reduces to. **STATUS: PROVED** (for the
deterministic core plus the general probabilistic mechanism), 0 `sorry`.

---

### §qr — Theorem `qr`, Corollary `qr-induction`

**(A)** Exact incremental QR update identity when adding one column to
the design matrix, and its inductive extension to a chain of updates.

**(B)** `IncrementalQRUpdate.lean`, **0 `sorry`**. The corollary was
previously a vacuous `: True := trivial` placeholder (a house-rule-1
violation, since fixed); it is now fully provable because a well-typed
`QRChain.insert` function was introduced whose *return type itself*
carries the invariants — making the induction proof collapse almost
entirely once that representation choice was made. Representation avoids
literal `Fin (p+1)`-indexed block matrices in favor of following the
paper's own three-paragraph proof structure directly.

---

### §noc — Proposition `noc`, Proposition `cyclic-gs`, Corollary `noc-summary`

**(A)** The exact gain-bias formula for a greedy single-pass fit under
interference between two nearby atoms; its Gauss-Seidel (cyclic-refit)
realization and the resulting exact `ε₁₂²` contraction rate per cycle.

**(B)** `InterferenceBias.lean`, **0 `sorry`**. Bias formula and the
contraction recursion/geometric decay: **proved**. The paper's own
`|ε₁₂| < 1` fact (from linear independence of the two atoms) is taken as
an explicit hypothesis `hEps` rather than re-derived from strict
Cauchy-Schwarz — a deliberate, documented scope choice, not a gap hidden
as a `sorry`. Uses the plain unweighted dot product, matching this
section's own specific choice in the paper (distinct from the weighted
inner product used elsewhere).

---

### §fourier (§11) — Lemma `kepler-series`, Lemma `eqcenter`, Proposition `fourier`

**(A)** A two-stage derivation: (1) perturbative — solve Kepler's
equation as a power series in eccentricity `e` via the implicit function
theorem, then convert to the "equation of center" `ν - M`, truncated to
`O(e²)` with an explicit `O(e³)` remainder bound; (2) trigonometric —
substitute the truncation into `cos(ν+ω)` and reduce via product-to-sum
identities to extract exact Fourier coefficients `A₁, B₁, A₂, B₂` (plus
the fundamental/second-harmonic amplitudes) and confirm non-degeneracy.

**(B)** `FourierStructure.lean`. **Stage 1 (perturbative): not
attempted** — this is genuine formal-power-series/asymptotic
(`Asymptotics.IsBigO`) analysis, deliberately deferred as out of scope
for this file (documented in its header, not a silent gap). **Stage 2
(trigonometric): fully proved, 0 `sorry`** — `fourier_decomposition`
takes the paper's own stated second-order truncations of `cos δ`,
`sin δ` as given input data (rather than re-deriving them from Stage 1),
and proves the resulting Fourier decomposition holds *exactly* for that
object, via `linear_combination` against six elementary sub-identities
(two product-to-sum, one `sin²` half-angle, two angle-sum expansions),
whose exact combination coefficients were derived by hand. The
non-degeneracy claim (Proposition `fourier`'s own citation, used
elsewhere in the paper) required a genuine correction — see Part C entry
4 below — now `fourier_coeffs_not_all_zero`, the corrected three-way
disjunction, fully proved via an elementary case split on `cos ω = 0`.
**STATUS: PARTIAL** (by design — stage 1 out of scope, stage 2 including
the corrected non-degeneracy fact fully proved).

---

### §12 — Proposition `amhm`

**(A)** `Var(unweighted)/Var(weighted) = (N⁻¹Σσn²)(N⁻¹Σσn⁻²) ≥ 1`,
equality iff all `σn²` equal — direct variance computation of the sample
mean vs. the Aitken GLS estimator, then AM-HM via Cauchy-Schwarz.

**(B)** `EfficiencyBoundUnweighted.lean`, **0 `sorry`**, proved in full
including the equality condition, via an explicit Lagrange-identity
lemma (`sum_mul_sum_inv_eq_iff`). Takes the two estimators' variance
*formulas* as given (not re-derived from a full measure-theoretic
observation model) — a documented scope choice, since re-deriving the
variance formulas themselves would duplicate `Common.lean`'s WLS
machinery for no new mathematical content.

---

### §13 — Proposition `uv-jacobian`, Corollary `uv-wellposed`

**(A)** The Jacobian determinant of `(u,v) ↦ (e,ω)` (`u=√e cos ω,
v=√e sin ω`) equals exactly `2` everywhere away from the origin; hence a
constant density factor `1/2` with no singularity at `e=0`, contrasting
with the `(e,ω)` chart's own area element `e·de·dω` which does vanish
there.

**(B)** `EccentricityVectorConditioning.lean`, **0 `sorry`**. Direct
partial-derivative computation (`∂e/∂u=2u, ∂e/∂v=2v`; `∂ω/∂u=-v/e,
∂ω/∂v=u/e` via `atan2` partials), giving `det J = 2`. **Correction note
in the file's own header:** an earlier draft formalized the *wrong* map
(`(e,ω)↦(e cos ω, e sin ω)` instead of the paper's actual `(u,v)↦(e,ω)`
with `u=√e cos ω`) — caught and fixed by rereading the source against
the Lean statement, per house rule 3.

---

### §14 — Lemma `sharpness`, Theorem `grid-completeness`

**(A)** `dν/dM = γ(e,E) := √(1-e²)/(1-e cos E)²`, maximized over `E` at
periastron `E=0`; then a uniform mean-anomaly grid of
`N_{M0}(e) = ⌈πγ(e)/ε⌉` points guarantees every true `M0⋆` is within `ε`
in true-anomaly space of some grid point, via the mean value theorem.

**(B)** `PeriastronSharpness.lean`, **FULLY VERIFIED, 0 `sorry`**
(confirmed corrected from `VERIFICATION_REPORT.md`'s stale "PARTIAL"
listing — see "Relationship to other files" above). Both halves are
complete: the maximization half (elementary — `1-e cos E` ranges over
`[1-e,1+e]`, minimized at `E=0`) and `grid-completeness` (elementary
half-grid-spacing argument) were already done in an earlier session; the
calculus chain producing `γ(e,E)` itself — previously *taken as given* —
was later derived from scratch: `nuCos`/`nuSin` (tangent half-angle
components, confirmed to trace a genuine unit circle via
`nuCos_sq_add_nuSin_sq_eq_one`), their derivatives via the quotient rule
(`nuCos_hasDerivAt`, `nuSin_hasDerivAt`), assembled into `dν/dE`
(`trueAnomalyRate_eq`), then chained with `Kepler.lean`'s
`keplerSolve_hasDerivAt` (`dE/dM`, itself via the inverse function
theorem on Kepler's equation) to recover `γ(e,E) = dν/dM` exactly
(`gammaEE_eq_dNu_dE_mul_dE_dM`).

---

### §15 — Theorem `envelope`, Corollary `envelope-single`

**(A)** The envelope theorem for the profiled Gaussian cost:
`∇_θ J(θ) = -2(∇_θ X(θ)β̂(θ))ᵀW r(θ)`, exactly the gradient treating
`β̂(θ)` as fixed, since the `β`-directional term vanishes at `β̂(θ)`'s own
stationary point of a strictly convex quadratic.

**(B)** `VariableProjection.lean`, **0 `sorry`**. Formalized abstractly
for a general `J:ℝ×ℝ→ℝ` (one real variable each) rather than the full
matrix/vector KNOMP setting — a deliberate scope choice (matching
`IncrementalQRUpdate.lean`'s own scope decision) since the one-real-variable
case already carries the full mathematical content (chain rule +
stationarity), with the multi-dimensional case adding only index
bookkeeping, not new mathematics. `envelope_theorem` + `stationary_of_
isLocalMin`. This general lemma is reused (not re-proved) by
`RobustCostGradientHessian.lean`'s gradient proposition.

---

### §16 — Theorem `augmentation`

**(A)** For candidate sets `C ⊂ C'`, `max_{C'} g ≥ max_C g` — a trivial
containment fact, with an accompanying remark that this says nothing
about distributional/expected improvement from specific augmentation
strategies.

**(B)** `MonotonicityAugmentation.lean`, **0 `sorry`**. Candidate set
modeled as `Finset α`, "best score" as `Finset.sup'`; a one-paragraph
containment proof matching the paper verbatim.

---

### §17 — Theorem `family-wise`

**(A)** Union-bound family-wise false-acceptance control: if each of
`K_max` sequential stages has false-acceptance probability `≤ α_fam/K_max`
under its own null, the family-wise probability of ≥1 spurious acceptance
is `≤ α_fam` — via Boole's inequality, requiring no independence or
disjointness assumption across stages (important since later-stage
residuals genuinely depend on earlier fits).

**(B)** `FamilyWiseErrorControl.lean`, **0 `sorry`**, direct application
of `measure_iUnion_le` plus summing equal per-stage budgets. Used by
`BICConsistency.lean`'s over-fitting half.

---

### §18 — Lemma `scale-covariance`, Theorem `jitter-inflation`, Remark "necessity of the single-global-ratio hypothesis"

**(A)** Scale covariance: for `W' = cW` (`c>0`), the WLS fit, residual,
and detection statistic scale exactly (`ρ_{W'}=c·ρ_W`), an algebraic
identity needing no distributional assumption. Jitter-inflation
corollary: if the true and modeled noise differ by a *constant* ratio
`α` across all `n` (`Σ_true=(1+α)Σ_model`), then `ρ_W^model=(1+α)ρ_W^true`
exactly. The paper's own remark then explicitly flags that this exact
identity does **not** generalize to *different* ratios `α_d` across
different datasets — only a weaker Loewner-order bound holds there.

**(B)** `ScaleCovarianceJitterInflation.lean`, **0 `sorry`**. Strategy
avoids symbolically computing `(cA)⁻¹`; instead characterizes `β̂` via a
cancellation lemma (`eq_inv_mulVec_of_mulVec_eq`, from `Common.lean`) —
shorter than the paper's own two-line cancellation argument, proving the
identical fact. The multi-dataset remark (weaker Loewner bound) is
**not** separately formalized — correctly so, since the paper itself
only states it as a caveat/negative remark, not a theorem requiring
proof (see Part C's note on this, distinguishing it from an actual paper
error).

---

### §19 — Theorem `near-dup` (a), (b), (c)

**(A)** (a) restricting the candidate set to exclude prior detections'
neighborhoods cannot increase the achieved max (an instance of Theorem
`augmentation` with roles exchanged); (b) a further genuine planet
outside every exclusion zone, with non-centrality →∞, is still
found/accepted with probability →1 (via a fixed positive distance from
the exclusion union, so a neighborhood lies entirely in the restricted
set, plus Lemma `grid-consistency` and Theorem `family-wise`'s detection
power); (c) immediate corollary of (a)+(b).

**(B)** `NonDegradationDuplicateSuppression.lean`. Part (a): **proved**,
direct restatement of `MonotonicityAugmentation.lean`'s `sup'_mono_of_
subset` with subset/superset roles swapped. Part (b): **axiomatized**,
not `sorry`'d — an explicit `Filter.Tendsto ... (𝓝 1)` hypothesis matching
the paper's own informal "probability →1" quantifier, rather than
re-deriving detection power from scratch (which would require the still-open
`lemma_grid_accuracy`). This is the model example cited by `CLAUDE.md`'s
house rule 4 for how a conditionally-true result should be handled. Part
(c): **partial**, an immediate corollary of (a)+(b), inheriting (b)'s
axiomatization. **STATUS: mixed** (proved + honestly axiomatized), 0
`sorry`.

---

### §20 — Proposition `alias`

**(A)** For periodic sampling windows (period `P_yr`), in the idealized
infinite-baseline limit the window's spectral response is supported
exactly on `f = k/P_yr`, so a periodogram of a single sinusoid at `f0`
shows equal-magnitude power at every alias `f0 + k/P_yr` — via Poisson
summation (Dirac comb Fourier series) + the convolution theorem, with an
explicit caveat that equal magnitudes hold only for an idealized
symmetric top-hat window; in general each alias is scaled by its own
window Fourier coefficient.

**(B)** `AnnualAliasFrequency.lean`, **PROVED, 0 `sorry`**, via a
reformulation that avoids distribution theory entirely: the aliasing
mechanism is proved as a *finite* trigonometric identity — decomposing
`w(t)·cos(2πf0t)` exactly via product-to-sum for a finite/truncated real
Fourier series representation of the window — rather than the paper's
literal idealized infinite-baseline Dirac-comb limit. This explicitly
does **not** capture the paper's literal infinite-limit statement (a
documented scope choice, not a silent narrowing — the header notes
`Mathlib.Analysis.Fourier.PoissonSummation` exists and could plausibly
bridge the gap to the literal statement, but this was not attempted).

---

## Part C — Mistakes found in the paper itself

These are places where the paper's own mathematics — not Lean/Mathlib
tooling coverage — is imprecise or wrong as literally stated. Entries 1,
2, 3 below consolidate and re-verify `proposed_changes.md`'s existing
entries (full detail there; summarized here for completeness); entry 4
does the same for that file's Fourier-non-degeneracy entry. One further
item (marked NOT A BUG) is included to distinguish a self-aware caveat
the paper already states correctly from an actual error.

**1. §7 step 7 / Lemma `grid-accuracy` — the `Θ(1)` vs. `Θ(√(N log N))`
claim is false as a literal inequality.** The paper's own step 7 (in the
form this project originally worked from) asserted the deterministic
drift order eventually dominates the concentration bound's noise order
at the rate-relevant grid resolution. Worked through explicitly, this is
false — the reverse holds, unboundedly — and the actual achievable
signal-to-noise wall for that proof technique is radius `Θ(N^{-1/4})`,
not the claimed `Θ(N^{-1/2})`. **Notably, the revised draft this report
is built from already concedes this itself**, as Remark `snr-wall`,
matching this project's independently-derived finding exactly, and
introduces Assumption `increment` as the fix. The residual gap is that
even under Assumption `increment`, the paper's literal rate proof (dyadic
annulus peeling to the exact `N^{-1/2}`, not just every `γ<1/2`) needs
summing a series simultaneously polynomial and doubly-exponential in the
annulus index — a step the paper's own proof sketch glosses over and
this project has not yet closed either (`grid_argmax_increment_rate`,
`sorry` #5). Full derivation: `proposed_changes.md` entry 1,
`GridSearchRate.lean` header, `GridSearchIncrementRate.lean` header.

**2. §4 Theorem `identifiability`, Step 2 — the "any 3 points" claim is
false for `k ≥ 1` atoms.** The paper's literal claim ("any 3 evaluation
points force all trend and atom coefficients to zero") is false at
*every* choice of 3 points once `k ≥ 1`, not merely on a measure-zero
exceptional set — a rank-nullity count: 3 linear equations cannot pin
down more than 3 unknowns, and atom coefficients add unknowns as `k`
grows. The correct statement is genericity (full column rank outside a
Lebesgue-null set), not a universal fixed-point-count argument. This is
exactly how `Identifiability.lean` was rewired (see Part B above).
Residual open work (the general `k≥1` case of `hli` itself) is a
Mathlib-coverage gap, not a further paper-math error — the paper-math
correction itself is complete. Full derivation: `proposed_changes.md`
entry 2.

**3. §7 Assumption `regularity` (R1)–(R3) — asserted with no supporting
argument, and R1/R3's real content is stronger than their stated form
suggests.** R1's genuine content is a bound *uniform in the observation
index `n`*, not per-`n` boundedness (which is automatic from continuity
+ compactness and requires no assumption at all) — the paper states R1
as if the easy, automatic half were the whole content. R3's genuine
content is a *quantitative* (e.g. quadratic) separation from the unique
minimizer, not mere qualitative uniqueness — a qualitative statement
alone is compatible with separations that shrink too fast to support the
finite-sample arguments elsewhere in the section that implicitly need a
quantitative bound. The paper should state R1's uniformity-in-`n`
requirement and R3's quantitative curvature constant explicitly, and
either prove them from the Kepler model's structure or cite the specific
geometric facts that make them true. Full derivation:
`proposed_changes.md` entry 3, including the update that
`KNOMP/KeplerFamily.lean` now proves R1's honest content in full for a
concrete Kepler family.

**4. §4/§11 — Identifiability's citation of Proposition `fourier`
("`A1, A2` not both zero") is false at `ω = π/2` for every eccentricity,
and the first proposed fix (using the fundamental-harmonic amplitude
instead) is *also* false, at `e = 2√2/3, ω = 0`.** Both `A1` and `A2` are
exactly proportional to `cos ω` (a structural consequence of `cos ν`
being even and `sin ν` odd in mean anomaly `M`, a genuine symmetry of
Kepler's equation — not a typo or edge case), so both vanish
simultaneously at `ω=π/2` for every `e`. The natural-seeming repair,
citing the amplitude `√(A1²+B1²)≠0` instead, is independently false at a
different, also-non-isolated point, since `B1`'s own `sin ω` factor
vanishes there too. **What actually holds and is now proved:** the
three-way disjunction `A1≠0 ∨ B1≠0 ∨ A2≠0`, via an elementary case split
on `cos ω = 0` (`FourierStructure.lean`'s `fourier_coeffs_not_all_zero`).
This does not invalidate `Theorem identifiability` itself — the correct
underlying fact is true and proved — but the paper's own citation
wording, and the natural first attempt at repairing it, are both wrong
as literally stated. Full derivation: `proposed_changes.md` entry 4.

**NOT A BUG — §18's own remark on the necessity of a single-global-ratio
hypothesis.** Worth flagging explicitly because it looks, on first
read, like the kind of gap entries 1–4 describe, but is not: the paper's
own remark in §18 already states, correctly and without needing
correction, that Theorem `jitter-inflation`'s exact identity does **not**
generalize to datasets with *different* per-dataset jitter ratios
`α_d` — only a weaker Loewner-order bound holds there — and the paper
does not claim otherwise. This is the paper being appropriately
self-aware about the scope of its own exact result, not an error. Listed
here for completeness (so a future audit doesn't waste time
re-discovering that this remark is already correct), not as an entry in
`proposed_changes.md`.

**Also worth noting, not a "bug" but a scope limitation stated in this
project's own files rather than the paper's:** `FourierStructure.lean`'s
stage 1 (the perturbative power-series derivation of the equation-of-center
truncation itself) and `AnnualAliasFrequency.lean`'s literal
infinite-baseline Dirac-comb limit are both real, deliberate Lean-side
scope decisions (documented in each file's own header) to formalize a
finite/given-input-data version of the paper's genuinely asymptotic or
distributional claim, rather than a gap in the paper's own mathematics.
These belong in `CLAUDE.md`'s "Open work" categorization, not this Part
C, and are listed here only to make the Part A/B distinction between
"paper is wrong" and "Lean formalization stopped short of the literal
statement" unambiguous.

---

## Appendix — full 27-file inventory (STATUS line + real `sorry` count)

| File | Status | Real `sorry` count |
|---|---|---|
| `AnalyticZeroMeasure.lean` | 0 sorry, 0 axiom | 0 |
| `AnnualAliasFrequency.lean` | PROVED (reformulated, avoids distribution theory) | 0 |
| `AsymptoticEfficiency.lean` | 2 open (`lemma_wu`, `lemma_grid_accuracy`) | 2 |
| `BICConsistency.lean` | PROVED (deterministic core + general mechanism) | 0 |
| `Common.lean` | PROVED | 0 |
| `EccentricityVectorConditioning.lean` | PROVED | 0 |
| `EfficiencyBoundUnweighted.lean` | PROVED, in full incl. equality condition | 0 |
| `ExactDetectionIncrement.lean` | PROVED | 0 |
| `FamilyWiseErrorControl.lean` | PROVED | 0 |
| `FourierStructure.lean` | PARTIAL (stage 1 not attempted; stage 2 proved) | 0 |
| `GlobalConvergence.lean` | mixed (proved + axiomatized) | 0 |
| `GridSearchConcentration.lean` | 0 sorry, 0 axiom | 0 |
| `GridSearchIncrementRate.lean` | 1 open (`grid_argmax_increment_rate`) | 1 |
| `GridSearchRate.lean` | 0 sorry, 0 axiom (does not reach paper's rate) | 0 |
| `Identifiability.lean` | 0 sorry, 0 axiom (`hli` general case is a hypothesis) | 0 |
| `IncrementalQRUpdate.lean` | PROVED, in full incl. `qr-induction` | 0 |
| `InterferenceBias.lean` | PROVED (`|ε12|<1` is an explicit hypothesis) | 0 |
| `JitterLikelihoodMaximizer.lean` | PROVED | 0 |
| `KeplerFamily.lean` | R1 proved; R2, R3 open | 2 |
| `Kepler.lean` | 0 sorry, 0 axiom | 0 |
| `LinearIndependentEvaluation.lean` | 0 sorry, 0 axiom | 0 |
| `MonotonicityAugmentation.lean` | PROVED | 0 |
| `NonDegradationDuplicateSuppression.lean` | mixed (proved + axiomatized) | 0 |
| `PeriastronSharpness.lean` | FULLY VERIFIED, 0 sorry | 0 |
| `RobustCostGradientHessian.lean` | PARTIAL → now all 3 claims present, proved | 0 |
| `ScaleCovarianceJitterInflation.lean` | PROVED | 0 |
| `VariableProjection.lean` | PROVED | 0 |

**Total: 5 real `sorry`s, 0 `axiom`s, 0 vacuous `True`-conclusions,
across 27 files covering all 32 numbered paper results plus its
Assumptions/Facts.**

Verify this count at any time with:
```bash
cd KNOMP_Lean/KNOMP
grep -n "^\s*sorry\s*$\|:= by sorry\|exact sorry\|<;> sorry" *.lean
```
(plain `grep -c sorry` overcounts — it also matches the word "sorry"
inside docstrings/prose describing other files' sorries or explaining
why a `sorry` was closed elsewhere).
