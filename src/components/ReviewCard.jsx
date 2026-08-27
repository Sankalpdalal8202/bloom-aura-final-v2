export default function ReviewCard({ review }) {
  return (
    <figure className="review-card">
      <div className="review-card__stars" aria-label={`${review.rating} out of 5 stars`}>
        {'\u2605'.repeat(review.rating)}
        {'\u2606'.repeat(5 - review.rating)}
      </div>
      <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
      <figcaption>
        <span className="review-card__name">{review.name}</span>
        <span className="review-card__occasion">{review.occasion}</span>
      </figcaption>
    </figure>
  )
}
